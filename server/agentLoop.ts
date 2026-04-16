/**
 * Future AI Platform — Autonomous Agentic Loop
 * 
 * This is the core execution engine that powers autonomous agents.
 * It implements the think → plan → tool_call → observe → repeat loop
 * and streams each step to the client via Server-Sent Events (SSE).
 */

import { routeLLMCall, type LLMMessage, type LLMTool } from "./llmRouter";
import { executeTool, getToolsForAgent, getTaskFiles, clearTaskFiles } from "./agentTools";
import { getAgentById, createTaskStep, updateTask } from "./db";
import type { Response } from "express";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentStep {
  id: string;
  type: "thinking" | "tool_call" | "tool_result" | "message" | "error" | "complete";
  title: string;
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: string;
  isError?: boolean;
  timestamp: number;
  artifacts?: { name: string; content: string; type: string }[];
}

export interface AgentRunOptions {
  taskId: number;
  agentId: number;
  userId: number;
  userMessage: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  onStep: (step: AgentStep) => void;
  onComplete: (result: { success: boolean; finalAnswer: string; steps: AgentStep[]; creditsUsed: number }) => void;
  onError: (error: string) => void;
}

// ─── SSE Helper ───────────────────────────────────────────────────────────────

export function sendSSE(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ─── Main Agentic Loop ────────────────────────────────────────────────────────

export async function runAgentLoop(options: AgentRunOptions): Promise<void> {
  const { taskId, agentId, userId, userMessage, onStep, onComplete, onError } = options;
  const steps: AgentStep[] = [];
  let totalCreditsUsed = 0;
  let stepIndex = 0;

  const emitStep = (step: Omit<AgentStep, "id" | "timestamp">) => {
    const fullStep: AgentStep = {
      ...step,
      id: `step_${++stepIndex}_${Date.now()}`,
      timestamp: Date.now(),
    };
    steps.push(fullStep);
    onStep(fullStep);

    // Persist to DB
    createTaskStep({
      taskId,
      stepNumber: stepIndex,
      type: step.type === "thinking" ? "thought" : step.type === "complete" ? "final" : step.type === "message" ? "llm_response" : step.type as "tool_call" | "tool_result" | "error" | "thought" | "llm_response" | "final",
      content: `${step.title}\n${step.content}`,
      toolName: step.toolName,
      toolInput: step.toolArgs ?? null,
      toolOutput: step.toolResult ? { output: step.toolResult } : null,
    }).catch(console.error);
  };

  try {
    // Load agent config
    const agent = await getAgentById(agentId);
    if (!agent) {
      onError("Agent not found");
      return;
    }

    // Get available tools for this agent
    const tools = getToolsForAgent({
      webSearchEnabled: agent.webSearchEnabled,
      codeExecutionEnabled: agent.codeExecutionEnabled,
      fileUploadEnabled: agent.fileUploadEnabled,
      apiCallsEnabled: agent.apiCallsEnabled,
    });

    // Build conversation messages
    const messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }> = [
      {
        role: "system",
        content: buildSystemPrompt(agent),
      },
      ...(options.conversationHistory ?? []).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: userMessage },
    ];

    emitStep({
      type: "thinking",
      title: "Agent is thinking...",
      content: `Processing your request: "${userMessage.substring(0, 100)}${userMessage.length > 100 ? "..." : ""}"`,
    });

    // ─── Agentic Loop ─────────────────────────────────────────────────────────
    const maxSteps = agent.maxSteps ?? 20;
    let loopCount = 0;
    let finalAnswer = "";
    let taskDone = false;

    while (loopCount < maxSteps && !taskDone) {
      loopCount++;

      // Call LLM with tools via the multi-provider router
      let llmResult;
      try {
        llmResult = await routeLLMCall({
          modelId: agent.modelId ?? "future-agent-1",
          messages: messages as LLMMessage[],
          tools: tools as LLMTool[],
          tool_choice: "auto",
          userId,
          agentId,
          taskId,
        });
      } catch (llmErr) {
        emitStep({
          type: "error",
          title: "LLM Error",
          content: `Failed to get response from AI: ${String(llmErr)}`,
          isError: true,
        });
        break;
      }

      // Track credits (already deducted inside routeLLMCall)
      totalCreditsUsed += llmResult.creditsUsed;

      const finishReason = llmResult.finishReason ?? "stop";

      // Add assistant message to history
      messages.push({
        role: "assistant",
        content: llmResult.content ?? "",
      });

      // ── Case 1: LLM wants to call a tool ──────────────────────────────────
      if (finishReason === "tool_calls" && llmResult.toolCalls && llmResult.toolCalls.length > 0) {
        for (const toolCall of llmResult.toolCalls) {
          const toolName = toolCall.name ?? "unknown";
          let toolArgs: Record<string, unknown> = {};

          try {
            toolArgs = JSON.parse(toolCall.arguments ?? "{}") as Record<string, unknown>;
          } catch {
            toolArgs = {};
          }

          // Emit tool call step
          emitStep({
            type: "tool_call",
            title: getToolTitle(toolName, toolArgs),
            content: getToolDescription(toolName, toolArgs),
            toolName,
            toolArgs,
          });

          // Handle task_complete specially
          if (toolName === "task_complete") {
            finalAnswer = (toolArgs.result as string) ?? "Task completed.";
            taskDone = true;
            emitStep({
              type: "complete",
              title: "Task Complete",
              content: finalAnswer,
              artifacts: getTaskFiles(String(taskId)).size > 0
                ? Array.from(getTaskFiles(String(taskId)).entries()).map(([name, content]) => ({
                    name,
                    content,
                    type: "text/plain",
                  }))
                : undefined,
            });
            break;
          }

          // Execute the tool
          const result = await executeTool(toolName, toolArgs, String(taskId));

          // Emit tool result
          emitStep({
            type: "tool_result",
            title: result.success ? `✓ ${getToolTitle(toolName, toolArgs)}` : `✗ Tool failed`,
            content: result.success ? result.output : (result.error ?? "Tool execution failed"),
            toolName,
            toolResult: result.output,
            isError: !result.success,
            artifacts: result.artifacts,
          });

          // Add tool result to messages for next LLM call
          messages.push({
            role: "tool" as const,
            content: result.success ? result.output : `Error: ${result.error}`,
          });
        }

        if (!taskDone) {
          // Emit thinking step for next iteration
          emitStep({
            type: "thinking",
            title: "Analyzing results...",
            content: "Processing tool results and determining next steps...",
          });
        }
      }
      // ── Case 2: LLM gives a direct text response ──────────────────────────
      else if (finishReason === "stop" || finishReason === "length") {
        const textContent = llmResult.content ?? "";

        if (textContent) {
          finalAnswer = textContent;
          taskDone = true;
          emitStep({
            type: "complete",
            title: "Task Complete",
            content: textContent,
            artifacts: getTaskFiles(String(taskId)).size > 0
              ? Array.from(getTaskFiles(String(taskId)).entries()).map(([name, content]) => ({
                  name,
                  content,
                  type: "text/plain",
                }))
              : undefined,
          });
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Max steps reached without completion
    if (!taskDone && loopCount >= maxSteps) {
      emitStep({
        type: "message",
        title: "Max steps reached",
        content: "The agent reached the maximum number of steps. Here is what was accomplished so far.",
      });
      finalAnswer = steps.filter(s => s.type === "tool_result").map(s => s.content).join("\n\n") || "Task partially completed.";
    }

    // Credits already deducted per-call inside routeLLMCall
    // Update task status
    await updateTask(taskId, { status: "completed" }).catch(console.error);

    // Clean up file store
    clearTaskFiles(String(taskId));

    onComplete({
      success: true,
      finalAnswer,
      steps,
      creditsUsed: totalCreditsUsed,
    });
  } catch (err) {
    console.error("[AgentLoop] Fatal error:", err);
    await updateTask(taskId, { status: "failed" }).catch(console.error);
    onError(String(err));
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSystemPrompt(agent: {
  systemPrompt: string | null;
  name: string;
  memoryEnabled: boolean;
  webSearchEnabled: boolean;
  codeExecutionEnabled: boolean;
  fileUploadEnabled: boolean;
  apiCallsEnabled: boolean;
}): string {
  const toolList: string[] = [];
  if (agent.webSearchEnabled) toolList.push("web_search — search the web for real-time, up-to-date information and news");
  if (agent.codeExecutionEnabled) toolList.push("code_execute — write and run Python, JavaScript, or shell code to solve problems");
  if (agent.fileUploadEnabled) toolList.push("read_file / write_file — read existing files or create new files as deliverables");
  if (agent.apiCallsEnabled) toolList.push("api_call — make HTTP requests to external services and APIs");
  toolList.push("analyze_data — process and interpret structured data, CSVs, or JSON");
  toolList.push("generate_image — create images from text descriptions");
  toolList.push("task_complete — signal task completion with a final comprehensive answer (REQUIRED to end task)");

  const toolSection = toolList.length > 0
    ? `\n\n## Available Tools\n${toolList.map(t => `- ${t}`).join("\n")}`
    : "";

  const basePrompt = agent.systemPrompt ||
    `You are ${agent.name}, an expert autonomous AI agent on the Future platform. You excel at breaking down complex tasks, reasoning step-by-step, and delivering high-quality, actionable results.`;

  return `${basePrompt}${toolSection}

## Reasoning & Execution Guidelines
- **Think before acting**: Carefully analyze what the user needs before choosing a tool or responding.
- **Be specific and thorough**: Vague or one-line answers are not acceptable. Provide detailed, accurate, well-structured responses.
- **Use tools strategically**: Only call a tool when it will genuinely improve your answer. Avoid redundant tool calls.
- **Multi-step tasks**: For complex requests, break the work into logical steps and execute them in sequence.
- **Cite sources**: When using web_search, always include relevant URLs or source names in your final answer.
- **Code quality**: When writing code, include comments, handle errors gracefully, and test edge cases.
- **Always finish**: You MUST call task_complete when you have a final answer. Never leave a task without completing it.
- **Honest uncertainty**: If you don't know something and can't look it up, say so clearly rather than guessing.

## Output Quality Standards
- Structure responses with headers, bullet points, numbered lists, or code blocks as appropriate.
- **Research tasks**: Comprehensive summary with key findings, data points, and sources.
- **Coding tasks**: Working, well-commented code with usage instructions and example output.
- **Business/strategy tasks**: Actionable recommendations with clear rationale and next steps.
- **Creative tasks**: Polished, complete output ready to use without further editing.
- **Simple questions**: Direct, concise answers — don't over-engineer simple requests.

Current date: ${new Date().toISOString().split("T")[0]}
Platform: Future AI`;
}

function getToolTitle(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case "web_search": return `Searching: "${String(args.query ?? "").substring(0, 50)}"`;
    case "code_execute": return `Running ${String(args.language ?? "code")} code`;
    case "read_file": return `Reading file: ${String(args.filename ?? "")}`;
    case "write_file": return `Writing file: ${String(args.filename ?? "")}`;
    case "api_call": return `API call: ${String(args.method ?? "GET")} ${String(args.url ?? "").substring(0, 50)}`;
    case "analyze_data": return `Analyzing data`;
    case "generate_image": return `Generating image`;
    case "task_complete": return `Completing task`;
    default: return `Using tool: ${toolName}`;
  }
}

function getToolDescription(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case "web_search": return `Searching the web for: "${String(args.query ?? "")}"`;
    case "code_execute": return `\`\`\`${String(args.language ?? "")}\n${String(args.code ?? "").substring(0, 300)}\n\`\`\``;
    case "read_file": return `Reading contents of "${String(args.filename ?? "")}"`;
    case "write_file": return `Creating file "${String(args.filename ?? "")}" — ${String(args.description ?? "")}`;
    case "api_call": return `${String(args.method ?? "GET")} ${String(args.url ?? "")}`;
    case "analyze_data": return `Task: ${String(args.task ?? "")}`;
    case "generate_image": return `Prompt: ${String(args.prompt ?? "").substring(0, 200)}`;
    case "task_complete": return String(args.result ?? "").substring(0, 200);
    default: return JSON.stringify(args).substring(0, 200);
  }
}
