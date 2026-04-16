/**
 * Future AI Platform — LLM Router
 *
 * Routes LLM calls directly to OpenAI (GPT-4o) or Anthropic (Claude)
 * based on the agent's configured modelId. Falls back to the built-in
 * Forge API for the Future Agent (future-agent-1).
 *
 * All calls track token usage and deduct credits from the user's balance.
 */

import { invokeLLM } from "./_core/llm";
import { getModelById, deductCredits, upsertDailyAnalytics } from "./db";
import { ENV } from "./_core/env";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

export interface LLMTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LLMRouterOptions {
  modelId: string;
  messages: LLMMessage[];
  userId: number;
  agentId?: number;
  taskId?: number;
  tools?: LLMTool[];
  tool_choice?: "auto" | "none" | "required";
  temperature?: number;
  maxTokens?: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface LLMRouterResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  creditsUsed: number;
  toolCalls?: ToolCall[];
  finishReason?: string;
  rawResponse?: unknown;
}

// ─── Provider Detection ───────────────────────────────────────────────────────

function getProvider(modelId: string): "openai" | "anthropic" | "future" {
  if (modelId.startsWith("gpt-")) return "openai";
  if (modelId.startsWith("claude-")) return "anthropic";
  return "future"; // future-agent-1 and any custom models
}

// ─── OpenAI Direct Call ───────────────────────────────────────────────────────

async function callOpenAI(opts: LLMRouterOptions): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls?: ToolCall[];
  finishReason?: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured. Please add it in Settings → Secrets.");

  const body: Record<string, unknown> = {
    model: opts.modelId,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4096,
  };

  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools;
    body.tool_choice = opts.tool_choice ?? "auto";
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{
      message: {
        content: string | null;
        tool_calls?: Array<{
          id: string;
          function: { name: string; arguments: string };
        }>;
      };
      finish_reason: string;
    }>;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  const choice = data.choices[0];
  const content = choice?.message?.content ?? "";
  const rawToolCalls = choice?.message?.tool_calls;

  const toolCalls: ToolCall[] | undefined = rawToolCalls?.map(tc => ({
    id: tc.id,
    name: tc.function.name,
    arguments: tc.function.arguments,
  }));

  return {
    content,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    toolCalls,
    finishReason: choice?.finish_reason,
  };
}

// ─── Anthropic (Claude) Direct Call ──────────────────────────────────────────

async function callAnthropic(opts: LLMRouterOptions): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls?: ToolCall[];
  finishReason?: string;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured. Please add it in Settings → Secrets.");

  // Separate system message from conversation
  const systemMsg = opts.messages.find(m => m.role === "system");
  const conversationMsgs = opts.messages.filter(m => m.role !== "system");

  // Convert tool results to Anthropic format
  const anthropicMessages = conversationMsgs.map(m => {
    if (m.role === "tool") {
      return {
        role: "user" as const,
        content: [{ type: "tool_result", tool_use_id: m.tool_call_id ?? "unknown", content: m.content }],
      };
    }
    return { role: m.role as "user" | "assistant", content: m.content };
  });

  const body: Record<string, unknown> = {
    model: opts.modelId,
    max_tokens: opts.maxTokens ?? 4096,
    messages: anthropicMessages,
    ...(systemMsg && { system: systemMsg.content }),
  };

  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    content: Array<{
      type: string;
      text?: string;
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
    }>;
    stop_reason: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  // Extract text content
  const textBlocks = data.content.filter(b => b.type === "text");
  const content = textBlocks.map(b => b.text ?? "").join("\n");

  // Extract tool use blocks
  const toolUseBlocks = data.content.filter(b => b.type === "tool_use");
  const toolCalls: ToolCall[] | undefined = toolUseBlocks.length > 0
    ? toolUseBlocks.map(b => ({
        id: b.id ?? `tool_${Date.now()}`,
        name: b.name ?? "unknown",
        arguments: JSON.stringify(b.input ?? {}),
      }))
    : undefined;

  // Map Anthropic stop reasons to OpenAI-style finish reasons
  const finishReasonMap: Record<string, string> = {
    end_turn: "stop",
    tool_use: "tool_calls",
    max_tokens: "length",
    stop_sequence: "stop",
  };

  return {
    content,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
    toolCalls,
    finishReason: finishReasonMap[data.stop_reason] ?? data.stop_reason,
  };
}

// ─── Future Agent (Built-in Forge) ───────────────────────────────────────────

async function callFutureAgent(opts: LLMRouterOptions): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls?: ToolCall[];
  finishReason?: string;
}> {
  const response = await invokeLLM({
    messages: opts.messages as Parameters<typeof invokeLLM>[0]["messages"],
    ...(opts.tools && { tools: opts.tools }),
    ...(opts.tools && { tool_choice: opts.tool_choice ?? "auto" }),
  });

  const choice = response.choices?.[0];
  const rawContent = choice?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : (rawContent == null ? "" : JSON.stringify(rawContent));

  const rawToolCalls = choice?.message?.tool_calls as Array<{
    id?: string;
    function: { name: string; arguments: string };
  }> | undefined;

  const toolCalls: ToolCall[] | undefined = rawToolCalls?.map((tc, i) => ({
    id: tc.id ?? `tool_${i}_${Date.now()}`,
    name: tc.function.name,
    arguments: tc.function.arguments,
  }));

  return {
    content,
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
    toolCalls,
    finishReason: choice?.finish_reason ?? undefined,
  };
}

// ─── Main Router ──────────────────────────────────────────────────────────────

export async function routeLLMCall(opts: LLMRouterOptions): Promise<LLMRouterResult> {
  const { modelId, userId, agentId, taskId } = opts;

  // Get model pricing config
  const model = await getModelById(modelId);
  if (!model) throw new Error(`Model "${modelId}" not found or not active`);

  const provider = getProvider(modelId);

  // ── Dispatch to correct provider ──
  let result: {
    content: string;
    inputTokens: number;
    outputTokens: number;
    toolCalls?: ToolCall[];
    finishReason?: string;
  };

  if (provider === "openai") {
    result = await callOpenAI(opts);
  } else if (provider === "anthropic") {
    result = await callAnthropic(opts);
  } else {
    result = await callFutureAgent(opts);
  }

  // ── Credit calculation ──
  // Credits are stored as whole numbers. Rates are credits-per-1k-tokens.
  // e.g. future-agent-1: 0.001 credits/token = 1 credit per 1000 tokens
  const inputCredits = Math.ceil((result.inputTokens / 1000) * model.creditsPerInputToken);
  const outputCredits = Math.ceil((result.outputTokens / 1000) * model.creditsPerOutputToken);
  const toolCallCredits = Math.ceil((result.toolCalls?.length ?? 0) * model.creditsPerToolCall);
  const totalCredits = Math.max(1, inputCredits + outputCredits + toolCallCredits);

  // ── Deduct credits ──
  const description = `${model.displayName} — ${result.inputTokens}in + ${result.outputTokens}out tokens`;
  await deductCredits(userId, totalCredits, description, taskId).catch(console.error);

  // ── Update analytics ──
  const today = new Date().toISOString().split("T")[0]!;
  await upsertDailyAnalytics(userId, agentId, today, {
    messageCount: 1,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    creditsUsed: totalCredits,
    toolCallCount: result.toolCalls?.length ?? 0,
  }).catch(console.error);

  return {
    content: result.content,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    creditsUsed: totalCredits,
    toolCalls: result.toolCalls,
    finishReason: result.finishReason,
  };
}

// ─── Credit Cost Calculator ───────────────────────────────────────────────────

export function calculateCreditCost(
  _modelId: string,
  inputTokens: number,
  outputTokens: number,
  toolCalls = 0,
  pricing: { creditsPerInputToken: number; creditsPerOutputToken: number; creditsPerToolCall: number }
): number {
  const inputCredits = Math.ceil((inputTokens / 1000) * pricing.creditsPerInputToken);
  const outputCredits = Math.ceil((outputTokens / 1000) * pricing.creditsPerOutputToken);
  const toolCredits = Math.ceil(toolCalls * pricing.creditsPerToolCall);
  return Math.max(1, inputCredits + outputCredits + toolCredits);
}
