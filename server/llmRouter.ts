/**
 * Future AI Platform — LLM Router
 *
 * Routes LLM calls to the correct provider based on modelId:
 *   gpt-*          → OpenAI
 *   claude-*       → Anthropic
 *   sonar*         → Perplexity (real-time web search)
 *   gemini-*       → Google Gemini
 *   llama-* / mixtral-* / whisper-* → Groq
 *   future-*       → Built-in Forge (Manus)
 *
 * All calls track token usage and deduct credits from the user's balance.
 */

import { invokeLLM } from "./_core/llm";
import { getModelById, deductCredits, upsertDailyAnalytics } from "./db";

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

type Provider = "openai" | "anthropic" | "perplexity" | "gemini" | "groq" | "future";

// ─── Provider Detection ───────────────────────────────────────────────────────

function getProvider(modelId: string): Provider {
  if (modelId.startsWith("gpt-") || modelId.startsWith("o1") || modelId.startsWith("o3")) return "openai";
  if (modelId.startsWith("claude-")) return "anthropic";
  if (modelId.startsWith("sonar") || modelId.startsWith("pplx-")) return "perplexity";
  if (modelId.startsWith("gemini-")) return "gemini";
  if (
    modelId.startsWith("llama-") ||
    modelId.startsWith("llama3") ||
    modelId.startsWith("mixtral-") ||
    modelId.startsWith("gemma-") ||
    modelId.startsWith("deepseek-")
  ) return "groq";
  return "future";
}

type ProviderResult = {
  content: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls?: ToolCall[];
  finishReason?: string;
};

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(opts: LLMRouterOptions): Promise<ProviderResult> {
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
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{
      message: { content: string | null; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> };
      finish_reason: string;
    }>;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  const choice = data.choices[0];
  const toolCalls = choice?.message?.tool_calls?.map(tc => ({
    id: tc.id,
    name: tc.function.name,
    arguments: tc.function.arguments,
  }));

  return {
    content: choice?.message?.content ?? "",
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    toolCalls,
    finishReason: choice?.finish_reason,
  };
}

// ─── Anthropic (Claude) ───────────────────────────────────────────────────────

async function callAnthropic(opts: LLMRouterOptions): Promise<ProviderResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured. Please add it in Settings → Secrets.");

  const systemMsg = opts.messages.find(m => m.role === "system");
  const conversationMsgs = opts.messages.filter(m => m.role !== "system");

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
    max_tokens: opts.maxTokens ?? 8192,
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
    content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
    stop_reason: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  const textBlocks = data.content.filter(b => b.type === "text");
  const content = textBlocks.map(b => b.text ?? "").join("\n");

  const toolUseBlocks = data.content.filter(b => b.type === "tool_use");
  const toolCalls: ToolCall[] | undefined = toolUseBlocks.length > 0
    ? toolUseBlocks.map(b => ({
        id: b.id ?? `tool_${Date.now()}`,
        name: b.name ?? "unknown",
        arguments: JSON.stringify(b.input ?? {}),
      }))
    : undefined;

  const finishReasonMap: Record<string, string> = {
    end_turn: "stop", tool_use: "tool_calls", max_tokens: "length", stop_sequence: "stop",
  };

  return {
    content,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
    toolCalls,
    finishReason: finishReasonMap[data.stop_reason] ?? data.stop_reason,
  };
}

// ─── Perplexity (Real-time Web Search) ───────────────────────────────────────

async function callPerplexity(opts: LLMRouterOptions): Promise<ProviderResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY is not configured. Please add it in Settings → Secrets.");

  // Perplexity uses OpenAI-compatible API but does not support tools natively
  const body: Record<string, unknown> = {
    model: opts.modelId,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2, // Lower temp for factual search results
    max_tokens: opts.maxTokens ?? 4096,
    return_citations: true,
    return_related_questions: false,
    search_recency_filter: "month",
  };

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{
      message: { content: string | null };
      finish_reason: string;
    }>;
    usage: { prompt_tokens: number; completion_tokens: number };
    citations?: string[];
  };

  const choice = data.choices[0];
  let content = choice?.message?.content ?? "";

  // Append citations if present
  if (data.citations && data.citations.length > 0) {
    content += "\n\n**Sources:**\n" + data.citations.map((c, i) => `[${i + 1}] ${c}`).join("\n");
  }

  return {
    content,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    finishReason: choice?.finish_reason,
  };
}

// ─── Google Gemini ────────────────────────────────────────────────────────────

async function callGemini(opts: LLMRouterOptions): Promise<ProviderResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not configured. Please add it in Settings → Secrets.");

  // Convert messages to Gemini format
  const systemMsg = opts.messages.find(m => m.role === "system");
  const conversationMsgs = opts.messages.filter(m => m.role !== "system");

  const contents = conversationMsgs.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 8192,
    },
    ...(systemMsg && {
      systemInstruction: { parts: [{ text: systemMsg.content }] },
    }),
  };

  // Add function declarations if tools provided
  if (opts.tools && opts.tools.length > 0) {
    body.tools = [{
      functionDeclarations: opts.tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    }];
  }

  const modelName = opts.modelId; // e.g. gemini-1.5-pro, gemini-2.0-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    candidates: Array<{
      content: { parts: Array<{ text?: string; functionCall?: { name: string; args: Record<string, unknown> } }> };
      finishReason: string;
    }>;
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
  };

  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];

  const textParts = parts.filter(p => p.text).map(p => p.text ?? "");
  const content = textParts.join("\n");

  const fnCallParts = parts.filter(p => p.functionCall);
  const toolCalls: ToolCall[] | undefined = fnCallParts.length > 0
    ? fnCallParts.map((p, i) => ({
        id: `gemini_tool_${i}_${Date.now()}`,
        name: p.functionCall!.name,
        arguments: JSON.stringify(p.functionCall!.args),
      }))
    : undefined;

  return {
    content,
    inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    toolCalls,
    finishReason: candidate?.finishReason?.toLowerCase() ?? "stop",
  };
}

// ─── Groq (Ultra-fast Llama / Mixtral) ───────────────────────────────────────

async function callGroq(opts: LLMRouterOptions): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured. Please add it in Settings → Secrets.");

  const body: Record<string, unknown> = {
    model: opts.modelId,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 8192,
  };

  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools;
    body.tool_choice = opts.tool_choice ?? "auto";
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{
      message: { content: string | null; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> };
      finish_reason: string;
    }>;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  const choice = data.choices[0];
  const toolCalls = choice?.message?.tool_calls?.map(tc => ({
    id: tc.id,
    name: tc.function.name,
    arguments: tc.function.arguments,
  }));

  return {
    content: choice?.message?.content ?? "",
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    toolCalls,
    finishReason: choice?.finish_reason,
  };
}

// ─── Future Agent (Built-in Forge) ───────────────────────────────────────────

async function callFutureAgent(opts: LLMRouterOptions): Promise<ProviderResult> {
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
  if (!model) throw new Error(`Model "${modelId}" not found or not active. Please check your model configuration.`);

  const provider = getProvider(modelId);

  // ── Dispatch to correct provider ──
  let result: ProviderResult;

  switch (provider) {
    case "openai":      result = await callOpenAI(opts); break;
    case "anthropic":   result = await callAnthropic(opts); break;
    case "perplexity":  result = await callPerplexity(opts); break;
    case "gemini":      result = await callGemini(opts); break;
    case "groq":        result = await callGroq(opts); break;
    default:            result = await callFutureAgent(opts); break;
  }

  // ── Credit calculation (credits per 1k tokens) ──
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
