/**
 * Future AI Platform — Intelligent LLM Router
 *
 * Automatically selects the best AI model for each task using semantic classification.
 * Users never see model names or provider details — Future handles everything.
 *
 * How it works:
 *   1. A fast Groq/OpenAI call classifies the task into one of 6 categories
 *   2. Each category maps to the best available provider + model
 *   3. A robust fallback chain ensures tasks always complete
 *
 * Routing categories:
 *   code_build        → Claude Opus (best for code & technical work)
 *   research_web      → Perplexity sonar-pro (real-time web search)
 *   creative_writing  → Claude Opus (best for long-form content)
 *   data_analysis     → GPT-4o (strong math & data reasoning)
 *   quick_answer      → Groq Llama 3.3 70B (ultra-fast, low latency)
 *   complex_reasoning → Claude Opus (strongest multi-step reasoning)
 *   Fallback          → Claude → GPT-4o → Groq → Built-in Forge
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

// ─── Intelligent Meta-Router ─────────────────────────────────────────────────

/**
 * Task categories that the meta-router can classify into.
 * Each maps to the best available provider for that workload.
 */
type TaskCategory =
  | "code_build"        // Writing code, building apps, debugging, technical implementation
  | "research_web"      // Finding current info, news, prices, facts that need web search
  | "creative_writing"  // Stories, books, marketing copy, scripts, long-form content
  | "data_analysis"     // Analyzing data, spreadsheets, charts, statistics, reports
  | "quick_answer"      // Simple Q&A, definitions, translations, short summaries
  | "complex_reasoning"; // Strategy, planning, multi-step reasoning, business decisions

interface RoutingDecision {
  category: TaskCategory;
  reasoning: string;  // Brief explanation of why this category was chosen
  needs_web_search: boolean; // Whether real-time web data is needed
}

/**
 * Maps a task category to the best available provider + model.
 * Priority order reflects capability fit for each workload.
 */
function categoryToModel(category: TaskCategory, needsWebSearch: boolean, hasTools = true): { modelId: string; provider: Provider } {
  // CRITICAL: Perplexity does NOT support tool calling.
  // Only use Perplexity for pure research_web tasks where the agent just needs
  // a text answer (no write_file, no code_execute, no tool calls needed).
  // For all other tasks that need tools, use Claude or GPT-4o instead.
  if (needsWebSearch && !hasTools && category === "research_web" && process.env.PERPLEXITY_API_KEY) {
    return { modelId: "sonar-pro", provider: "perplexity" };
  }

  switch (category) {
    case "code_build":
      // Claude is the best at code generation and technical implementation
      if (process.env.ANTHROPIC_API_KEY) return { modelId: "claude-opus-4-5", provider: "anthropic" };
      if (process.env.OPENAI_API_KEY) return { modelId: "gpt-4o", provider: "openai" };
      if (process.env.GROQ_API_KEY) return { modelId: "llama-3.3-70b-versatile", provider: "groq" };
      break;

    case "research_web":
      // Perplexity is best for web research (already handled above if available)
      if (process.env.OPENAI_API_KEY) return { modelId: "gpt-4o", provider: "openai" };
      if (process.env.ANTHROPIC_API_KEY) return { modelId: "claude-opus-4-5", provider: "anthropic" };
      break;

    case "creative_writing":
      // Claude excels at long-form creative writing and nuanced tone
      if (process.env.ANTHROPIC_API_KEY) return { modelId: "claude-opus-4-5", provider: "anthropic" };
      if (process.env.OPENAI_API_KEY) return { modelId: "gpt-4o", provider: "openai" };
      break;

    case "data_analysis":
      // OpenAI GPT-4o has strong data/math reasoning; Claude is a solid alternative
      if (process.env.OPENAI_API_KEY) return { modelId: "gpt-4o", provider: "openai" };
      if (process.env.ANTHROPIC_API_KEY) return { modelId: "claude-opus-4-5", provider: "anthropic" };
      break;

    case "quick_answer":
      // Groq is ultra-fast for simple tasks; great UX for short answers
      if (process.env.GROQ_API_KEY) return { modelId: "llama-3.3-70b-versatile", provider: "groq" };
      if (process.env.OPENAI_API_KEY) return { modelId: "gpt-4o-mini", provider: "openai" };
      if (process.env.ANTHROPIC_API_KEY) return { modelId: "claude-haiku-4-5", provider: "anthropic" };
      break;

    case "complex_reasoning":
      // Claude Opus is the strongest at multi-step reasoning and strategy
      if (process.env.ANTHROPIC_API_KEY) return { modelId: "claude-opus-4-5", provider: "anthropic" };
      if (process.env.OPENAI_API_KEY) return { modelId: "gpt-4o", provider: "openai" };
      break;
  }

  // Universal fallback chain
  if (process.env.ANTHROPIC_API_KEY) return { modelId: "claude-opus-4-5", provider: "anthropic" };
  if (process.env.OPENAI_API_KEY) return { modelId: "gpt-4o", provider: "openai" };
  if (process.env.GROQ_API_KEY) return { modelId: "llama-3.3-70b-versatile", provider: "groq" };
  return { modelId: "future-agent-1", provider: "future" };
}

/**
 * Intelligent meta-router: uses a fast LLM to semantically classify the task
 * and return the best model for it. Falls back to a safe default if classification fails.
 *
 * Uses Groq (Llama 3.3 70B) for classification — it's fast (~200ms) and free,
 * so it adds minimal latency while providing genuine semantic understanding.
 */
async function intelligentAutoSelect(messages: LLMMessage[]): Promise<{ modelId: string; provider: Provider }> {
  // Build a concise task description from the conversation
  const userMessages = messages.filter(m => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1]?.content ?? "";
  const systemMsg = messages.find(m => m.role === "system")?.content ?? "";

  // Truncate to keep the classification call fast
  const taskDescription = [
    systemMsg ? `System context: ${systemMsg.substring(0, 300)}` : "",
    `User request: ${lastUserMsg.substring(0, 600)}`,
  ].filter(Boolean).join("\n");

  const classificationPrompt = `You are a task router for an AI platform. Classify the following task into exactly one category and determine if it needs real-time web data.

Categories:
- code_build: Writing, debugging, or building code, apps, websites, scripts, APIs, databases
- research_web: Finding current facts, news, prices, recent events, live data that requires web search
- creative_writing: Stories, books, marketing copy, emails, scripts, long-form content, branding
- data_analysis: Analyzing data, spreadsheets, statistics, financial models, reports, charts
- quick_answer: Simple questions, definitions, translations, brief summaries, factual lookups
- complex_reasoning: Strategy, business planning, multi-step problem solving, comparisons, recommendations

Task to classify:
${taskDescription}

Respond with JSON only.`;

  try {
    // Use Groq for fast classification — if Groq unavailable, use OpenAI
    const classifierApiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const classifierEndpoint = process.env.GROQ_API_KEY
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const classifierModel = process.env.GROQ_API_KEY
      ? "llama-3.3-70b-versatile"
      : "gpt-4o-mini";

    if (!classifierApiKey) throw new Error("No classifier API key available");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s max for classification

    let decision: RoutingDecision;

    try {
      const response = await fetch(classifierEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${classifierApiKey}`,
        },
        body: JSON.stringify({
          model: classifierModel,
          messages: [{ role: "user", content: classificationPrompt }],
          temperature: 0,
          max_tokens: 150,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Classifier HTTP ${response.status}`);

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };
      const raw = data.choices[0]?.message?.content ?? "{}";
      decision = JSON.parse(raw) as RoutingDecision;
    } finally {
      clearTimeout(timeout);
    }

    // Validate the decision
    const validCategories: TaskCategory[] = [
      "code_build", "research_web", "creative_writing",
      "data_analysis", "quick_answer", "complex_reasoning",
    ];
    if (!validCategories.includes(decision.category)) {
      throw new Error(`Invalid category: ${decision.category}`);
    }

    // Always pass hasTools=true because the agent loop always uses tools.
    // This prevents Perplexity (which doesn't support tool calling) from being
    // selected for any agentic task.
    const selected = categoryToModel(decision.category, decision.needs_web_search ?? false, true);
    console.log(
      `[LLMRouter] Meta-router → category="${decision.category}" web=${decision.needs_web_search} → ${selected.provider}/${selected.modelId}` +
      (decision.reasoning ? ` (${decision.reasoning.substring(0, 80)})` : "")
    );
    return selected;

  } catch (err) {
    // If classification fails for any reason, fall back to a safe capable default
    console.warn("[LLMRouter] Meta-router classification failed, using safe default:", String(err).substring(0, 100));
    if (process.env.ANTHROPIC_API_KEY) return { modelId: "claude-opus-4-5", provider: "anthropic" };
    if (process.env.OPENAI_API_KEY) return { modelId: "gpt-4o", provider: "openai" };
    if (process.env.GROQ_API_KEY) return { modelId: "llama-3.3-70b-versatile", provider: "groq" };
    return { modelId: "future-agent-1", provider: "future" };
  }
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

/** Trim messages for Groq to stay within TPM limits. Keep system + last N non-system messages. */
function trimMessagesForGroq(messages: LLMMessage[], maxNonSystem = 8): LLMMessage[] {
  const system = messages.filter(m => m.role === 'system');
  const nonSystem = messages.filter(m => m.role !== 'system');
  // Always keep the first user message (the original task) and the last N messages
  const firstUser = nonSystem.find(m => m.role === 'user');
  const rest = nonSystem.slice(-maxNonSystem);
  const combined = firstUser && !rest.includes(firstUser) ? [firstUser, ...rest] : rest;
  return [...system, ...combined];
}

async function callGroq(opts: LLMRouterOptions & { modelId: string }): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq is not configured.");

  // Trim messages to stay within Groq's TPM limits
  const trimmedMessages = trimMessagesForGroq(opts.messages);

  const body: Record<string, unknown> = {
    model: opts.modelId,
    messages: trimmedMessages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 8192,
  };

  if (opts.tools && opts.tools.length > 0) {
    // Groq has strict TPM limits — trim tool descriptions to avoid 413 errors
    body.tools = opts.tools.map(t => ({
      ...t,
      function: {
        ...t.function,
        description: t.function.description.split('.')[0].substring(0, 120), // First sentence, max 120 chars
      }
    }));
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
  // Wrap invokeLLM with a 90-second timeout to prevent infinite hangs
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Future AI request timed out after 90s")), 90000)
  );

  const response = await Promise.race([
    invokeLLM({
      messages: opts.messages as Parameters<typeof invokeLLM>[0]["messages"],
      ...(opts.tools && { tools: opts.tools }),
      ...(opts.tools && { tool_choice: opts.tool_choice ?? "auto" }),
    }),
    timeoutPromise,
  ]);

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
    const selected = await intelligentAutoSelect(opts.messages);
    selectedModelId = selected.modelId;
    provider = selected.provider;
  } else {
    provider = getProvider(selectedModelId);
  }

  const result = await callWithFallback(provider, { ...opts, modelId: selectedModelId! });

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
