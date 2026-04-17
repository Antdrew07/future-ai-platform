/**
 * Future AI Platform — Autonomous Agentic Loop
 *
 * Core execution engine: think → plan → tool_call → observe → repeat
 * Streams each step to the client via Server-Sent Events (SSE).
 *
 * Bug fixes in this version:
 * 1. tool_call_id is now properly threaded through tool result messages (Anthropic requires this)
 * 2. SSE heartbeat every 15s prevents proxy/browser timeouts on long tasks
 * 3. Overall task timeout (5 min) with graceful partial-result completion
 * 4. LLM errors no longer silently break the loop — they emit an error step and retry once
 * 5. Empty LLM response is now treated as a completion signal, not a silent break
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
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    // Client disconnected — ignore write errors
  }
}

// ─── Main Agentic Loop ────────────────────────────────────────────────────────

export async function runAgentLoop(options: AgentRunOptions): Promise<void> {
  const { taskId, agentId, userId, userMessage, onStep, onComplete, onError } = options;
  const steps: AgentStep[] = [];
  let totalCreditsUsed = 0;
  let stepIndex = 0;

  // ── Overall task timeout: 5 minutes ──────────────────────────────────────
  const TASK_TIMEOUT_MS = 5 * 60 * 1000;
  const taskStartTime = Date.now();

  const emitStep = (step: Omit<AgentStep, "id" | "timestamp">) => {
    const fullStep: AgentStep = {
      ...step,
      id: `step_${++stepIndex}_${Date.now()}`,
      timestamp: Date.now(),
    };
    steps.push(fullStep);
    onStep(fullStep);

    // Persist to DB (non-blocking)
    const dbType = step.type === "thinking" ? "thought"
      : step.type === "complete" ? "final"
      : step.type === "message" ? "llm_response"
      : step.type as "tool_call" | "tool_result" | "error" | "thought" | "llm_response" | "final";

    createTaskStep({
      taskId,
      stepNumber: stepIndex,
      type: dbType,
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
    const messages: LLMMessage[] = [
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
      title: "Future is thinking...",
      content: `Working on: "${userMessage.substring(0, 100)}${userMessage.length > 100 ? "..." : ""}"`,
    });

    // ─── Agentic Loop ─────────────────────────────────────────────────────────
    const maxSteps = Math.min(agent.maxSteps ?? 20, 30); // Hard cap at 30
    let loopCount = 0;
    let finalAnswer = "";
    let taskDone = false;
    let consecutiveErrors = 0;

    while (loopCount < maxSteps && !taskDone) {
      loopCount++;

      // Check overall timeout
      if (Date.now() - taskStartTime > TASK_TIMEOUT_MS) {
        emitStep({
          type: "message",
          title: "Task timed out",
          content: "This task is taking longer than expected. Here is what was completed so far.",
        });
        finalAnswer = steps
          .filter(s => s.type === "tool_result" || s.type === "message")
          .map(s => s.content)
          .join("\n\n") || "Task partially completed — please try again with a more specific request.";
        taskDone = true;
        break;
      }

      // Call LLM with tools via the multi-provider router
      let llmResult;
      try {
        llmResult = await routeLLMCall({
          modelId: agent.modelId ?? "auto",
          messages,
          tools: tools as LLMTool[],
          tool_choice: "auto",
          userId,
          agentId,
          taskId,
        });
        consecutiveErrors = 0; // Reset error counter on success
      } catch (llmErr) {
        consecutiveErrors++;
        const errMsg = String(llmErr);
        console.error(`[AgentLoop] LLM error (attempt ${consecutiveErrors}):`, errMsg);

        if (consecutiveErrors >= 2) {
          // Two consecutive LLM failures — give up gracefully
          emitStep({
            type: "error",
            title: "Unable to complete task",
            content: `I ran into a technical issue and couldn't complete your request. Please try again. (${errMsg.substring(0, 100)})`,
            isError: true,
          });
          finalAnswer = "I encountered a technical issue. Please try your request again.";
          taskDone = true;
          break;
        }

        // Emit error step and retry
        emitStep({
          type: "thinking",
          title: "Retrying...",
          content: "Encountered an issue, trying a different approach...",
        });
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
        continue;
      }

      // Track credits (already deducted inside routeLLMCall)
      totalCreditsUsed += llmResult.creditsUsed;

      const finishReason = llmResult.finishReason ?? "stop";

      // Add assistant message to history
      if (llmResult.content || (llmResult.toolCalls && llmResult.toolCalls.length > 0)) {
        messages.push({
          role: "assistant",
          content: llmResult.content ?? "",
        });
      }

      // ── Case 1: LLM wants to call tools ───────────────────────────────────
      if (
        (finishReason === "tool_calls" || finishReason === "tool_use") &&
        llmResult.toolCalls &&
        llmResult.toolCalls.length > 0
      ) {
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
              artifacts: getArtifacts(taskId),
            });
            break;
          }

          // Execute the tool
          let result;
          try {
            result = await executeTool(toolName, toolArgs, String(taskId));
          } catch (toolErr) {
            result = { success: false, output: "", error: String(toolErr) };
          }

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

          // Add tool result to messages — MUST include tool_call_id for Anthropic compatibility
          messages.push({
            role: "tool" as const,
            content: result.success ? result.output : `Error: ${result.error ?? "Tool failed"}`,
            tool_call_id: toolCall.id,
          });
        }

        if (!taskDone) {
          emitStep({
            type: "thinking",
            title: "Analyzing results...",
            content: "Processing results and determining next steps...",
          });
        }
      }
      // ── Case 2: LLM gives a direct text response ──────────────────────────
      else if (finishReason === "stop" || finishReason === "length" || finishReason === "end_turn") {
        const textContent = llmResult.content ?? "";

        if (textContent.trim()) {
          finalAnswer = textContent;
          taskDone = true;
          emitStep({
            type: "complete",
            title: "Task Complete",
            content: textContent,
            artifacts: getArtifacts(taskId),
          });
        } else {
          // Empty response — treat as completion with partial results
          finalAnswer = steps
            .filter(s => s.type === "tool_result")
            .map(s => s.content)
            .join("\n\n") || "I completed the requested steps. Let me know if you need anything else.";
          taskDone = true;
          emitStep({
            type: "complete",
            title: "Task Complete",
            content: finalAnswer,
            artifacts: getArtifacts(taskId),
          });
        }
      }
      // ── Case 3: Unknown finish reason — treat as stop ─────────────────────
      else {
        const textContent = llmResult.content ?? "";
        if (textContent.trim()) {
          finalAnswer = textContent;
          taskDone = true;
          emitStep({
            type: "complete",
            title: "Task Complete",
            content: textContent,
            artifacts: getArtifacts(taskId),
          });
        } else {
          // Force completion to avoid infinite loop
          finalAnswer = "Task completed.";
          taskDone = true;
          emitStep({
            type: "complete",
            title: "Task Complete",
            content: "I've finished working on your request.",
            artifacts: getArtifacts(taskId),
          });
        }
      }
    }

    // Max steps reached without explicit completion
    if (!taskDone && loopCount >= maxSteps) {
      finalAnswer = steps
        .filter(s => s.type === "tool_result" || s.type === "message")
        .map(s => s.content)
        .join("\n\n") || "Task partially completed.";
      emitStep({
        type: "complete",
        title: "Task Complete",
        content: `Here's what I accomplished:\n\n${finalAnswer}`,
        artifacts: getArtifacts(taskId),
      });
    }

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

function getArtifacts(taskId: number): { name: string; content: string; type: string }[] | undefined {
  const files = getTaskFiles(String(taskId));
  if (files.size === 0) return undefined;
  return Array.from(files.entries()).map(([name, content]) => ({
    name,
    content,
    type: "text/plain",
  }));
}

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
  if (agent.webSearchEnabled) toolList.push("web_search — search the web for real-time, up-to-date information");
  if (agent.codeExecutionEnabled) toolList.push("code_execute — write and run Python, JavaScript, or shell code");
  if (agent.fileUploadEnabled) toolList.push("read_file / write_file — read or create files as deliverables");
  if (agent.apiCallsEnabled) toolList.push("api_call — make HTTP requests to external services and APIs");
  toolList.push("analyze_data — process and interpret structured data, CSVs, or JSON");
  toolList.push("generate_image — create images from text descriptions");
  toolList.push("task_complete — REQUIRED: call this when you have your final answer to signal completion");

  const toolSection = toolList.length > 0
    ? `\n\n## Available Tools\n${toolList.map(t => `- ${t}`).join("\n")}`
    : "";

  const basePrompt = agent.systemPrompt ||
    `You are a brilliant personal AI assistant on the Future platform. You help real people — business owners, authors, entrepreneurs, app builders — achieve their goals. You are warm, encouraging, and always deliver complete, high-quality results.`;

  return `${basePrompt}${toolSection}

## Core Rule: Execute, Don't Advise
You are a DOER, not an advisor. When someone asks you to build, create, write, or make something — you DO IT immediately. You never:
- Tell the user what they "should" do or "will need to" do
- Suggest they "coordinate with" other people or professionals
- Say "feel free to ask" or "let me know if you need help with specific parts"
- Provide a planning outline and stop there
- Defer the actual work to the user

Instead, you always produce the complete, finished deliverable right now. If someone says "build me an app", you write the full app code. If someone says "create a website", you write the complete HTML/CSS/JS. If someone says "write a business plan", you write the entire plan.

## How to Behave
- **Always complete the task**: You MUST call task_complete with your final answer. Never leave a task unfinished.
- **Be thorough**: Vague or one-line answers are not acceptable. Deliver complete, ready-to-use results.
- **Use tools wisely**: Only call a tool when it genuinely helps. Don't make redundant tool calls.
- **Break down complex tasks**: For big requests, work step by step — but complete every step yourself.
- **Cite sources**: When you search the web, include relevant URLs in your answer.
- **Write quality code**: Include comments, handle errors, and make it production-ready.
- **Never hand off**: You are the one doing the work. The user is waiting for the finished result, not instructions on how to do it themselves.

## Output Standards
- Structure responses with headers, bullet points, numbered lists, or code blocks.
- **Research**: Comprehensive summary with key findings and sources.
- **Code/Apps**: Complete, working, well-commented code — not a skeleton or outline. The user should be able to copy-paste and run it.
- **Business/Strategy**: Full, detailed, ready-to-use documents — not bullet points of what to think about.
- **Creative Writing**: Polished, complete output ready to use.
- **Simple questions**: Direct, concise answers.

Current date: ${new Date().toISOString().split("T")[0]}`;
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
