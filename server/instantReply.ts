/**
 * Future AI Platform — Instant Reply Streamer
 *
 * Streams a fast acknowledgment response to the user within ~300-500ms
 * using Groq (Llama 3.3 70B) before the full agent loop begins.
 *
 * This gives the user immediate feedback that their request was understood,
 * while the deep agent works in parallel on the actual task.
 */

import type { Response } from "express";
import { sendSSE } from "./agentLoop";

interface InstantReplyOptions {
  res: Response;
  taskId: number;
  message: string;
  agentSystemPrompt?: string;
  onBroadcast: (event: string, data: unknown) => void;
}

/**
 * Streams a fast acknowledgment reply using Groq's streaming API.
 * Emits `instant_reply_token` events for each streamed token,
 * then `instant_reply_done` when complete.
 *
 * If Groq is unavailable, falls back to OpenAI streaming.
 * If both fail, silently skips (the agent loop still runs).
 */
export async function streamInstantReply({
  taskId,
  message,
  agentSystemPrompt,
  onBroadcast,
}: InstantReplyOptions): Promise<void> {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const apiKey = groqKey || openaiKey;
  if (!apiKey) return; // No fast provider available, skip silently

  const endpoint = groqKey
    ? "https://api.groq.com/openai/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const model = groqKey ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

  const systemPrompt = [
    agentSystemPrompt
      ? `You are an AI assistant. Your persona: ${agentSystemPrompt.substring(0, 200)}`
      : "You are Future AI, a helpful and capable AI assistant.",
    "",
    "The user has sent you a task. Your job right now is to give a SHORT, warm, confident acknowledgment (2-3 sentences max).",
    "Tell them you understand what they want and briefly mention what you're about to do.",
    "Be specific about their request — don't be generic.",
    "Do NOT start solving the task yet. Do NOT use bullet points or headers.",
    "Sound natural and confident, like a capable person who just got a clear assignment.",
    "Examples of good acknowledgments:",
    '- "Got it! I\'ll research the latest trends in renewable energy and compile a detailed report for you. Give me a moment to gather the most current data."',
    '- "On it! I\'m going to build that Python web scraper for you — I\'ll set up the structure, handle pagination, and export to CSV. Starting now."',
    '- "Sure! I\'ll write that 5-chapter outline for your business book, focusing on practical frameworks. Let me put that together for you."',
  ].join("\n");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s max

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 120,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok || !response.body) {
      console.warn(`[InstantReply] ${model} returned ${response.status}, skipping`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6)) as {
            choices?: Array<{
              delta?: { content?: string };
              finish_reason?: string;
            }>;
          };

          const token = json.choices?.[0]?.delta?.content;
          if (token) {
            fullText += token;
            onBroadcast("instant_reply_token", { token, taskId });
          }
        } catch {
          // Ignore malformed SSE chunks
        }
      }
    }

    // Signal that the instant reply is complete
    if (fullText.trim()) {
      onBroadcast("instant_reply_done", { text: fullText, taskId });
      console.log(`[InstantReply] Streamed ${fullText.length} chars via ${model}`);
    }
  } catch (err) {
    // Never let instant reply failure block the agent loop
    console.warn("[InstantReply] Failed, agent loop continues:", String(err).substring(0, 100));
  }
}
