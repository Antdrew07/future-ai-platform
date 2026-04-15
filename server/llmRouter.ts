import { invokeLLM } from "./_core/llm";
import { getModelById, deductCredits, upsertDailyAnalytics } from "./db";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface LLMRouterOptions {
  modelId: string;
  messages: LLMMessage[];
  userId: number;
  agentId?: number;
  taskId?: number;
  tools?: Array<{ type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } }>;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMRouterResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  creditsUsed: number;
  toolCalls?: Array<{ name: string; arguments: string }>;
  finishReason?: string;
}

export async function routeLLMCall(opts: LLMRouterOptions): Promise<LLMRouterResult> {
  const { modelId, messages, userId, agentId, taskId } = opts;

  // Get model pricing
  const model = await getModelById(modelId);
  if (!model) throw new Error(`Model ${modelId} not found or not active`);

  // Estimate pre-call credits (rough estimate for balance check)
  const estimatedInputTokens = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
  const estimatedCredits = Math.ceil(estimatedInputTokens * model.creditsPerInputToken * 1000);

  // Check balance
  const hasCredits = await deductCredits(userId, 0, "balance_check"); // just check, don't deduct yet
  // We'll do actual deduction after we know real token counts

  // Call LLM via built-in provider
  const response = await invokeLLM({
    messages: messages as Parameters<typeof invokeLLM>[0]["messages"],
    ...(opts.tools && { tools: opts.tools }),
  });

  const choice = response.choices?.[0];
  const rawContent = choice?.message?.content;
  const content = typeof rawContent === 'string' ? rawContent : (rawContent == null ? '' : JSON.stringify(rawContent));
  const usage = response.usage ?? { prompt_tokens: estimatedInputTokens, completion_tokens: 0 };

  const inputTokens = usage.prompt_tokens ?? 0;
  const outputTokens = usage.completion_tokens ?? 0;

  // Calculate actual credits
  const inputCredits = Math.ceil(inputTokens * model.creditsPerInputToken * 1000);
  const outputCredits = Math.ceil(outputTokens * model.creditsPerOutputToken * 1000);
  const toolCallCredits = (choice?.message?.tool_calls?.length ?? 0) * Math.ceil(model.creditsPerToolCall * 100);
  const totalCredits = inputCredits + outputCredits + toolCallCredits;

  // Deduct credits
  const description = `LLM call: ${model.displayName} (${inputTokens}in + ${outputTokens}out tokens)`;
  await deductCredits(userId, totalCredits, description, taskId);

  // Update analytics
  const today = new Date().toISOString().split("T")[0]!;
  await upsertDailyAnalytics(userId, agentId, today, {
    messageCount: 1,
    inputTokens,
    outputTokens,
    creditsUsed: totalCredits,
    toolCallCount: choice?.message?.tool_calls?.length ?? 0,
  });

  const toolCalls = choice?.message?.tool_calls?.map((tc: { function: { name: string; arguments: string } }) => ({
    name: tc.function.name,
    arguments: tc.function.arguments,
  }));

  return {
    content,
    inputTokens,
    outputTokens,
    creditsUsed: totalCredits,
    toolCalls,
    finishReason: choice?.finish_reason ?? undefined,
  };
}

export function calculateCreditCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  toolCalls = 0,
  pricing: { creditsPerInputToken: number; creditsPerOutputToken: number; creditsPerToolCall: number }
): number {
  const inputCredits = Math.ceil(inputTokens * pricing.creditsPerInputToken * 1000);
  const outputCredits = Math.ceil(outputTokens * pricing.creditsPerOutputToken * 1000);
  const toolCredits = Math.ceil(toolCalls * pricing.creditsPerToolCall * 100);
  return inputCredits + outputCredits + toolCredits;
}
