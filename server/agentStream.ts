/**
 * Future AI Platform — Agent Streaming Endpoint
 *
 * Provides SSE (Server-Sent Events) endpoint for real-time agent execution.
 * Route: POST /api/agent/run  — starts a task and streams steps
 * Route: GET  /api/agent/stream/:taskId — reconnect to existing stream
 *
 * Fixes in this version:
 * 1. SSE heartbeat every 15s prevents proxy/browser/CDN timeouts on long tasks
 * 2. Heartbeat is cleared on task completion/error/disconnect
 * 3. insertId extraction is more robust (handles both MySQL and TiDB responses)
 */

import type { Express, Request, Response } from "express";
import { runAgentLoop, sendSSE } from "./agentLoop";
import { getAgentById, createTask, getUserCreditBalance } from "./db";
import { sdk } from "./_core/sdk";
import type { AgentStep } from "./agentLoop";

// In-memory map of active streams (taskId → list of SSE response objects)
const activeStreams = new Map<number, Response[]>();

function addStream(taskId: number, res: Response) {
  const existing = activeStreams.get(taskId) ?? [];
  existing.push(res);
  activeStreams.set(taskId, existing);
}

function removeStream(taskId: number, res: Response) {
  const existing = activeStreams.get(taskId) ?? [];
  activeStreams.set(taskId, existing.filter(r => r !== res));
}

function broadcastToTask(taskId: number, event: string, data: unknown) {
  const streams = activeStreams.get(taskId) ?? [];
  for (const res of streams) {
    sendSSE(res, event, data);
  }
}

function closeAllStreams(taskId: number) {
  const streams = activeStreams.get(taskId) ?? [];
  for (const s of streams) {
    try { s.end(); } catch { /* ignore */ }
  }
  activeStreams.delete(taskId);
}

function extractInsertId(result: unknown): number {
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    // Drizzle MySQL returns insertId directly
    if (typeof r.insertId === "number" && r.insertId > 0) return r.insertId;
    // Some adapters wrap it
    if (Array.isArray(r) && r.length > 0) {
      const first = r[0] as Record<string, unknown>;
      if (typeof first.insertId === "number") return first.insertId;
    }
  }
  return 0;
}

export function registerAgentStreamRoutes(app: Express) {
  /**
   * POST /api/agent/run
   * Body: { agentId, message, conversationHistory? }
   * Starts an agent task and streams execution steps via SSE.
   */
  app.post("/api/agent/run", async (req: Request, res: Response) => {
    // Auth check
    const user = await sdk.authenticateRequest(req).catch(() => null);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { agentId, message, conversationHistory } = req.body as {
      agentId: number;
      message: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    };

    if (!agentId || !message) {
      res.status(400).json({ error: "agentId and message are required" });
      return;
    }

    // Check credit balance
    const balance = await getUserCreditBalance(user.id);
    if (balance < 1) {
      res.status(402).json({ error: "You've run out of credits. Please upgrade your plan to continue." });
      return;
    }

    // Load agent
    const agent = await getAgentById(agentId);
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    // Create task record
    const taskResult = await createTask({
      agentId,
      userId: user.id,
      title: message.substring(0, 200),
      input: message,
      status: "running",
    });

    const taskId = extractInsertId(taskResult);
    if (!taskId) {
      res.status(500).json({ error: "Failed to create task. Please try again." });
      return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Register this response as an active stream
    addStream(taskId, res);

    // Send initial event with taskId
    sendSSE(res, "task_created", { taskId, agentId, status: "running" });

    // ── Heartbeat: send a ping every 15s to keep the connection alive ────────
    // This prevents proxies, CDNs, and browsers from closing idle SSE connections
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeatInterval);
      }
    }, 15000);

    // Handle client disconnect
    req.on("close", () => {
      clearInterval(heartbeatInterval);
      removeStream(taskId, res);
    });

    // Run the agentic loop
    try {
      await runAgentLoop({
        taskId,
        agentId,
        userId: user.id,
        userMessage: message,
        conversationHistory,
        onStep: (step: AgentStep) => {
          broadcastToTask(taskId, "step", step);
        },
        onComplete: (result) => {
          clearInterval(heartbeatInterval);
          broadcastToTask(taskId, "complete", {
            taskId,
            finalAnswer: result.finalAnswer,
            creditsUsed: result.creditsUsed,
            stepCount: result.steps.length,
          });
          closeAllStreams(taskId);
        },
        onError: (error) => {
          clearInterval(heartbeatInterval);
          broadcastToTask(taskId, "error", { taskId, error });
          closeAllStreams(taskId);
        },
      });
    } catch (err) {
      clearInterval(heartbeatInterval);
      broadcastToTask(taskId, "error", { taskId, error: String(err) });
      closeAllStreams(taskId);
    }
  });

  /**
   * GET /api/agent/stream/:taskId
   * Reconnect to an existing task stream (e.g., after page refresh)
   */
  app.get("/api/agent/stream/:taskId", async (req: Request, res: Response) => {
    const user = await sdk.authenticateRequest(req).catch(() => null);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const taskId = parseInt(req.params.taskId ?? "0");
    if (!taskId) {
      res.status(400).json({ error: "Invalid taskId" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const isActive = (activeStreams.get(taskId)?.length ?? 0) > 0;

    if (isActive) {
      // Task is still running — attach to it
      addStream(taskId, res);
      req.on("close", () => removeStream(taskId, res));
    } else {
      // Task already completed — inform client
      sendSSE(res, "info", {
        message: "This task has already completed. Check your task history for results.",
      });
      res.end();
    }
  });

  /**
   * POST /api/agent/chat
   * Simple non-streaming chat with an agent (for embed/API use)
   * Body: { agentId, message }
   */
  app.post("/api/agent/chat", async (req: Request, res: Response) => {
    const user = await sdk.authenticateRequest(req).catch(() => null);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { agentId, message } = req.body as { agentId: number; message: string };

    if (!agentId || !message) {
      res.status(400).json({ error: "agentId and message are required" });
      return;
    }

    const steps: AgentStep[] = [];
    let finalAnswer = "";
    let creditsUsed = 0;

    const taskResult = await createTask({
      agentId,
      userId: user.id,
      title: message.substring(0, 200),
      input: message,
      status: "running",
    });

    const taskId = extractInsertId(taskResult);
    if (!taskId) {
      res.status(500).json({ error: "Failed to create task" });
      return;
    }

    await runAgentLoop({
      taskId,
      agentId,
      userId: user.id,
      userMessage: message,
      onStep: (step) => steps.push(step),
      onComplete: (result) => {
        finalAnswer = result.finalAnswer;
        creditsUsed = result.creditsUsed;
      },
      onError: (error) => {
        finalAnswer = `I encountered an issue: ${error}. Please try again.`;
      },
    });

    res.json({
      taskId,
      answer: finalAnswer,
      steps: steps.map(s => ({ type: s.type, title: s.title, content: s.content })),
      creditsUsed,
    });
  });
}
