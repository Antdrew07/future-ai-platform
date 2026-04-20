/**
 * Future AI Platform — Public Agent Router
 *
 * Provides truly public, unauthenticated access to agents that have been
 * marked `isPublic = true` by their owner.
 *
 * This fixes the critical bug where "public" agents still required an
 * authenticated session to chat with them.
 *
 * Security measures:
 *  1. IP-based rate limiting (20 req/min per IP, 200 req/day per IP)
 *  2. Agent must explicitly have `isPublic = true`
 *  3. Anonymous sessions are tracked by a short-lived token (no DB user created)
 *  4. Credits are drawn from the agent owner's balance (not the visitor's)
 *  5. Conversation history is stored per anonymous session token
 *
 * Routes:
 *  GET  /api/public/agent/:slug        — Get public agent info
 *  POST /api/public/agent/:slug/chat   — Chat with a public agent
 *  GET  /api/public/agent/:slug/embed  — Embeddable iframe HTML
 */

import type { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { getAgentBySlug, getAgentById, getUserById, deductCredits, getOrCreateConversation, addMessage, getMessages } from "./db";
import { routeLLMCall } from "./llmRouter";
import { nanoid } from "nanoid";

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/**
 * Per-IP rate limiter: 20 requests per minute.
 * Prevents abuse of public agent endpoints.
 */
const perMinuteLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 20,                   // 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment before sending another message." },
  keyGenerator: (req) => req.ip ?? "unknown",
});

/**
 * Per-IP daily rate limiter: 200 requests per day.
 * Prevents sustained scraping or bot abuse.
 */
const perDayLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 200,                       // 200 requests per day per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Daily request limit reached. Public agents allow up to 200 messages per day per IP." },
  keyGenerator: (req) => req.ip ?? "unknown",
});

// ─── Anonymous Session Token ──────────────────────────────────────────────────

/**
 * Generate or extract an anonymous session token from the request.
 * The token is returned in the response header so the client can persist it.
 */
function getOrCreateAnonSession(req: Request, res: Response): string {
  const existing = req.headers["x-anon-session"] as string | undefined;
  if (existing && /^anon_[a-zA-Z0-9_-]{21}$/.test(existing)) {
    return existing;
  }
  const token = `anon_${nanoid(21)}`;
  res.setHeader("X-Anon-Session", token);
  return token;
}

// ─── Route Registration ───────────────────────────────────────────────────────

export function registerPublicAgentRoutes(app: Express) {
  /**
   * GET /api/public/agent/:slug
   * Returns public metadata for a published agent.
   * No authentication required.
   */
  app.get("/api/public/agent/:slug", perMinuteLimiter, async (req: Request, res: Response) => {
    const agent = await getAgentBySlug(req.params.slug).catch(() => null);

    if (!agent || !agent.isPublic) {
      res.status(404).json({ error: "Agent not found or not public" });
      return;
    }

    // Return only safe public fields — never expose systemPrompt or owner details
    res.json({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatar: agent.avatar,
      slug: agent.slug,
      totalRuns: agent.totalRuns,
    });
  });

  /**
   * POST /api/public/agent/:slug/chat
   * Send a message to a public agent without authentication.
   * Uses the agent owner's credits.
   */
  app.post(
    "/api/public/agent/:slug/chat",
    perMinuteLimiter,
    perDayLimiter,
    async (req: Request, res: Response) => {
      const { message } = req.body as { message?: string };

      if (!message || typeof message !== "string" || message.trim().length === 0) {
        res.status(400).json({ error: "message is required" });
        return;
      }

      if (message.length > 4000) {
        res.status(400).json({ error: "Message too long (max 4000 characters)" });
        return;
      }

      // Load agent
      const agent = await getAgentBySlug(req.params.slug).catch(() => null);
      if (!agent || !agent.isPublic) {
        res.status(404).json({ error: "Agent not found or not public" });
        return;
      }

      // Check owner has enough credits to serve this request
      const owner = await getUserById(agent.userId).catch(() => null);
      if (!owner) {
        res.status(503).json({ error: "Agent is temporarily unavailable" });
        return;
      }

      // Minimum 5 credits required in owner's account to serve public requests
      if (owner.creditBalance < 5) {
        res.status(503).json({ error: "This agent has run out of credits. Please contact the agent owner." });
        return;
      }

      // Get or create anonymous session
      const anonSession = getOrCreateAnonSession(req, res);
      const sessionId = `public_${agent.id}_${anonSession}`;

      // Load conversation history for this anonymous session
      const conv = await getOrCreateConversation(agent.id, sessionId, undefined);
      const history = await getMessages(conv.id);

      const messages = [
        {
          role: "system" as const,
          content: agent.systemPrompt || `You are ${agent.name}. ${agent.description ?? ""}`,
        },
        ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: message },
      ];

      // Save user message
      await addMessage({ conversationId: conv.id, role: "user", content: message });

      // Call LLM (billed to agent owner)
      let result;
      try {
        result = await routeLLMCall({
          modelId: agent.modelId,
          messages,
          userId: agent.userId, // Bill owner, not anonymous visitor
          agentId: agent.id,
        });
      } catch (err) {
        res.status(500).json({ error: "The agent encountered an error. Please try again." });
        return;
      }

      // Deduct credits from owner
      await deductCredits(
        agent.userId,
        result.creditsUsed,
        `Public chat — agent "${agent.name}" (slug: ${agent.slug})`,
      );

      // Save assistant response
      await addMessage({
        conversationId: conv.id,
        role: "assistant",
        content: result.content,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        creditsUsed: result.creditsUsed,
      });

      res.json({
        content: result.content,
        sessionToken: anonSession, // Client should persist this for conversation continuity
      });
    },
  );

  /**
   * GET /api/public/agent/:slug/embed
   * Returns a self-contained embeddable chat widget HTML.
   * Embed on any website with: <iframe src="https://yourapp.com/api/public/agent/my-agent/embed">
   */
  app.get("/api/public/agent/:slug/embed", async (req: Request, res: Response) => {
    const agent = await getAgentBySlug(req.params.slug).catch(() => null);

    if (!agent || !agent.isPublic) {
      res.status(404).send("<html><body>Agent not found or not public.</body></html>");
      return;
    }

    const origin = `${req.protocol}://${req.get("host")}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${agent.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f0f0f; color: #e5e5e5; height: 100vh; display: flex; flex-direction: column; }
    #header { padding: 12px 16px; background: #1a1a1a; border-bottom: 1px solid #2a2a2a; display: flex; align-items: center; gap: 10px; }
    #header h1 { font-size: 15px; font-weight: 600; }
    #header p { font-size: 12px; color: #888; }
    #messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; }
    .msg.user { align-self: flex-end; background: #7c3aed; color: #fff; }
    .msg.assistant { align-self: flex-start; background: #1e1e1e; border: 1px solid #2a2a2a; }
    .msg.thinking { opacity: 0.5; font-style: italic; }
    #input-area { padding: 12px; background: #1a1a1a; border-top: 1px solid #2a2a2a; display: flex; gap: 8px; }
    #input { flex: 1; background: #2a2a2a; border: 1px solid #3a3a3a; color: #e5e5e5; padding: 10px 14px; border-radius: 8px; font-size: 14px; outline: none; resize: none; }
    #input:focus { border-color: #7c3aed; }
    #send { background: #7c3aed; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
    #send:disabled { opacity: 0.5; cursor: not-allowed; }
    #powered { text-align: center; padding: 6px; font-size: 11px; color: #555; }
    #powered a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <div id="header">
    <div>
      <h1>${agent.name}</h1>
      ${agent.description ? `<p>${agent.description}</p>` : ""}
    </div>
  </div>
  <div id="messages">
    <div class="msg assistant">Hi! I'm ${agent.name}. How can I help you today?</div>
  </div>
  <div id="input-area">
    <textarea id="input" placeholder="Type a message..." rows="1"></textarea>
    <button id="send">Send</button>
  </div>
  <div id="powered">Powered by <a href="${origin}" target="_blank">Future AI</a></div>
  <script>
    const slug = "${agent.slug}";
    const apiBase = "${origin}/api/public/agent/" + slug;
    let sessionToken = localStorage.getItem("future_anon_${agent.id}") || "";
    let sending = false;

    const messagesEl = document.getElementById("messages");
    const inputEl = document.getElementById("input");
    const sendBtn = document.getElementById("send");

    function addMessage(role, text) {
      const div = document.createElement("div");
      div.className = "msg " + role;
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return div;
    }

    async function send() {
      const msg = inputEl.value.trim();
      if (!msg || sending) return;
      sending = true;
      sendBtn.disabled = true;
      inputEl.value = "";
      addMessage("user", msg);
      const thinking = addMessage("assistant thinking", "Thinking...");
      try {
        const headers = { "Content-Type": "application/json" };
        if (sessionToken) headers["X-Anon-Session"] = sessionToken;
        const res = await fetch(apiBase + "/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({ message: msg }),
        });
        const data = await res.json();
        thinking.remove();
        if (data.error) {
          addMessage("assistant", "Error: " + data.error);
        } else {
          addMessage("assistant", data.content);
          if (data.sessionToken) {
            sessionToken = data.sessionToken;
            localStorage.setItem("future_anon_${agent.id}", sessionToken);
          }
        }
      } catch (e) {
        thinking.remove();
        addMessage("assistant", "Connection error. Please try again.");
      }
      sending = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }

    sendBtn.addEventListener("click", send);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });
}
