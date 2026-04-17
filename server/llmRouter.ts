/**
 * Future AI Platform — Smart LLM Router
 *
 * Automatically selects the best AI model for each task.
 * Users never see model names or provider details — Future handles everything.
 *
 * Auto-routing logic:
 *   Web/research tasks     → Perplexity (real-time search)
 *   Code/build tasks       → Claude 3.5 Sonnet (best for code)
 *   Creative/writing tasks → Claude 3.5 Sonnet (best for long-form)
 *   Fast/simple tasks      → Groq Llama 3.3 70B (ultra-fast)
 *   Complex reasoning      → Claude 3.5 Sonnet (best reasoning)
 *   Fallback               → Built-in Forge (always available)
 */

import { invokeLLM } from "./_core/llm";
import { deductCredits, upsertDailyAnalytics } from "./db";

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
  modelId?: string; // Optional — if omitted, auto-routing picks the best model
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

// ─── Smart Auto-Routing ───────────────────────────────────────────────────────

/**
 * Classifies the user's task and returns the best model + provider.
 * This is completely invisible to the user — they just see "Future AI".
 */
function autoSelectModel(messages: LLMMessage[]): { modelId: string; provider: Provider } {
  // Get the last user message to classify the task
  const userMessages = messages.filter(m => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1]?.content?.toLowerCase() ?? "";
  const systemMsg = messages.find(m => m.role === "system")?.content?.toLowerCase() ?? "";
  const combined = lastUserMsg + " " + systemMsg;

  // Web search / research tasks → Perplexity (has real-time web access)
  const isWebTask = /search|research|find|look up|latest|news|current|today|recent|2024|2025|2026|website.*copy|copy.*website|elevation church|scrape|crawl|what is|who is|how much|price of|stock|weather/.test(combined);
  if (isWebTask && process.env.PERPLEXITY_API_KEY) {
    return { modelId: "sonar-pro", provider: "perplexity" };
  }

  // Code / app building tasks → Claude (best for code generation)
  const isCodeTask = /build|create|code|program|app|website|html|css|javascript|python|react|node|api|database|function|class|component|android|ios|iphone|mobile|flutter|swift|kotlin/.test(combined);
  if (isCodeTask && process.env.ANTHROPIC_API_KEY) {
    return { modelId: "claude-3-5-sonnet-20241022", provider: "anthropic" };
  }

  // Creative / writing tasks → Claude (best for long-form creative writing)
  const isCreativeTask = /write|book|novel|story|chapter|blog|article|essay|marketing|copy|script|email|letter|poem|creative|brand|slogan|tagline|pitch|proposal|plan|strategy/.test(combined);
  if (isCreativeTask && process.env.ANTHROPIC_API_KEY) {
    return { modelId: "claude-3-5-sonnet-20241022", provider: "anthropic" };
  }

  // Fast / simple tasks → Groq (ultra-fast, great for quick answers)
  const isFastTask = /summarize|translate|explain|what does|define|list|give me|tell me|help me understand|quick|simple|brief/.test(combined);
  if (isFastTask && process.env.GROQ_API_KEY) {
    return { modelId: "llama-3.3-70b-versatile", provider: "groq" };
  }

  // Complex reasoning / analysis → Claude
  const isComplexTask = /analyze|analysis|compare|evaluate|assess|review|audit|diagnose|optimize|improve|strategy|decision|recommend/.test(combined);
  if (isComplexTask && process.env.ANTHROPIC_API_KEY) {
    return { modelId: "claude-3-5-sonnet-20241022", provider: "anthropic" };
  }

  // Business / financial tasks → OpenAI GPT-4o
  const isBusinessTask = /business plan|financial|revenue|profit|market|startup|investor|pitch deck|valuation|forecast|budget|roi|kpi/.test(combined);
  if (isBusinessTask && process.env.OPENAI_API_KEY) {
    return { modelId: "gpt-4o", provider: "openai" };
  }

  // Default: try Claude first, then Groq, then built-in
  if (process.env.ANTHROPIC_API_KEY) {
    return { modelId: "claude-3-5-sonnet-20241022", provider: "anthropic" };
  }
  if (process.env.GROQ_API_KEY) {
    return { modelId: "llama-3.3-70b-versatile", provider: "groq" };
  }
  if (process.env.OPENAI_API_KEY) {
    return { modelId: "gpt-4o", provider: "openai" };
  }

  // Always-available fallback
  return { modelId: "future-agent-1", provider: "future" };
}

// ─── Provider Detection (for explicit modelId override) ──────────────────────

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

// ─── Credit Cost (flat rate per call, no DB lookup needed) ───────────────────

const CREDIT_COSTS: Record<Provider, { inputPer1k: number; outputPer1k: number }> = {
  anthropic:  { inputPer1k: 3, outputPer1k: 15 },
  openai:     { inputPer1k: 2.5, outputPer1k: 10 },
  perplexity: { inputPer1k: 1, outputPer1k: 5 },
  gemini:     { inputPer1k: 1, outputPer1k: 4 },
  groq:       { inputPer1k: 0.5, outputPer1k: 1 },
  future:     { inputPer1k: 1, outputPer1k: 2 },
};

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(opts: LLMRouterOptions & { modelId: string }): Promise<ProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI is not configured.");

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI service error (${response.status}): ${err.substring(0, 200)}`);
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
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Anthropic (Claude) ───────────────────────────────────────────────────────

async function callAnthropic(opts: LLMRouterOptions & { modelId: string }): Promise<ProviderResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic is not configured.");

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout for complex tasks

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI service error (${response.status}): ${err.substring(0, 200)}`);
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
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Perplexity (Real-time Web Search) ───────────────────────────────────────

async function callPerplexity(opts: LLMRouterOptions & { modelId: string }): Promise<ProviderResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("Perplexity is not configured.");

  const body: Record<string, unknown> = {
    model: opts.modelId,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 4096,
    return_citations: true,
    return_related_questions: false,
    search_recency_filter: "month",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI service error (${response.status}): ${err.substring(0, 200)}`);
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

    if (data.citations && data.citations.length > 0) {
      content += "\n\n**Sources:**\n" + data.citations.map((c, i) => `[${i + 1}] ${c}`).join("\n");
    }

    return {
      content,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      finishReason: choice?.finish_reason,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Google Gemini ────────────────────────────────────────────────────────────

async function callGemini(opts: LLMRouterOptions & { modelId: string }): Promise<ProviderResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("Google AI is not configured.");

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

  if (opts.tools && opts.tools.length > 0) {
    body.tools = [{
      functionDeclarations: opts.tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    }];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.modelId}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI service error (${response.status}): ${err.substring(0, 200)}`);
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
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Groq (Ultra-fast) ────────────────────────────────────────────────────────

async function callGroq(opts: LLMRouterOptions & { modelId: string }): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq is not configured.");

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI service error (${response.status}): ${err.substring(0, 200)}`);
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
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Future Agent (Built-in Forge — Always Available) ────────────────────────

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

// ─── Provider Retry with Fallback ─────────────────────────────────────────────

async function callWithFallback(
  provider: Provider,
  opts: LLMRouterOptions & { modelId: string },
  attempt = 0
): Promise<ProviderResult> {
  try {
    switch (provider) {
      case "openai":     return await callOpenAI(opts);
      case "anthropic":  return await callAnthropic(opts);
      case "perplexity": return await callPerplexity(opts);
      case "gemini":     return await callGemini(opts);
      case "groq":       return await callGroq(opts);
      default:           return await callFutureAgent(opts);
    }
  } catch (err) {
    const errMsg = String(err);
    console.error(`[LLMRouter] ${provider} failed (attempt ${attempt + 1}):`, errMsg);

    // Retry once on timeout/network errors
    if (attempt === 0 && (errMsg.includes("abort") || errMsg.includes("timeout") || errMsg.includes("network"))) {
      console.log(`[LLMRouter] Retrying ${provider}...`);
      return callWithFallback(provider, opts, 1);
    }

    // Fallback chain: anthropic → groq → future
    if (provider !== "groq" && process.env.GROQ_API_KEY) {
      console.log(`[LLMRouter] Falling back to Groq after ${provider} failure`);
      return callWithFallback("groq", { ...opts, modelId: "llama-3.3-70b-versatile" }, 0);
    }
    if (provider !== "future") {
      console.log(`[LLMRouter] Falling back to built-in Future AI`);
      return callFutureAgent(opts);
    }
    throw err;
  }
}

// ─── Main Router ──────────────────────────────────────────────────────────────

export async function routeLLMCall(opts: LLMRouterOptions): Promise<LLMRouterResult> {
  const { userId, agentId, taskId } = opts;

  // Auto-select model if not specified (or if it's a legacy "future-agent-*" placeholder)
  let selectedModelId = opts.modelId;
  let provider: Provider;

  if (!selectedModelId || selectedModelId.startsWith("future-agent-") || selectedModelId === "auto") {
    const selected = autoSelectModel(opts.messages);
    selectedModelId = selected.modelId;
    provider = selected.provider;
    console.log(`[LLMRouter] Auto-selected: ${provider} (${selectedModelId})`);
  } else {
    provider = getProvider(selectedModelId);
  }

  const result = await callWithFallback(provider, { ...opts, modelId: selectedModelId });

  // ── Credit calculation (flat rate, no DB lookup) ──
  const costs = CREDIT_COSTS[provider];
  const inputCredits = Math.ceil((result.inputTokens / 1000) * costs.inputPer1k);
  const outputCredits = Math.ceil((result.outputTokens / 1000) * costs.outputPer1k);
  const toolCallCredits = (result.toolCalls?.length ?? 0) * 1;
  const totalCredits = Math.max(1, inputCredits + outputCredits + toolCallCredits);

  // ── Deduct credits ──
  await deductCredits(userId, totalCredits, `Future AI — ${result.inputTokens}in + ${result.outputTokens}out tokens`, taskId).catch(console.error);

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

// ─── Credit Cost Calculator (kept for compatibility) ─────────────────────────

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
