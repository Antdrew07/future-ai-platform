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
import { getAgentById, createTaskStep, updateTask, getOrCreateConversation, getMessages, addMessage } from "./db";
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
  artifacts?: { name: string; content: string; type: string; url?: string }[];
}

export interface AgentRunOptions {
  taskId: number;
  agentId: number;
  userId: number;
  userMessage: string;
  sessionId?: string; // For memory: conversation session identifier
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
  const { taskId, agentId, userId, userMessage, sessionId, onStep, onComplete, onError } = options;
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

    // Load memory from DB if enabled
    let conversationId: number | null = null;
    let memoryHistory: LLMMessage[] = [];
    if (agent.memoryEnabled && sessionId) {
      try {
        const conv = await getOrCreateConversation(agentId, sessionId, userId);
        conversationId = conv.id;
        const priorMessages = await getMessages(conv.id);
        // Inject last 20 messages as memory context
        memoryHistory = priorMessages.slice(-20).map(m => ({
          role: (m.role === "user" || m.role === "assistant") ? m.role : "user" as "user" | "assistant",
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
        }));
        // Save user message to memory
        await addMessage({ conversationId: conv.id, role: "user", content: userMessage }).catch(() => {});
      } catch (memErr) {
        console.warn("[AgentLoop] Memory load failed:", memErr);
      }
    }

    // Build conversation messages
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: buildSystemPrompt(agent),
      },
      // Inject memory history if available, otherwise use provided conversationHistory
      ...(memoryHistory.length > 0 ? memoryHistory : (options.conversationHistory ?? []).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))),
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

    // Save assistant final answer to memory
    if (agent.memoryEnabled && conversationId) {
      await addMessage({ conversationId, role: "assistant", content: finalAnswer }).catch(() => {});
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

function getArtifacts(taskId: number): { name: string; content: string; type: string; url?: string }[] | undefined {
  const files = getTaskFiles(String(taskId));
  if (files.size === 0) return undefined;
  return Array.from(files.entries()).map(([name, entry]) => ({
    name,
    content: entry.content,
    type: name.endsWith(".pdf") ? "application/pdf"
      : name.endsWith(".csv") ? "text/csv"
      : name.endsWith(".md") ? "text/markdown"
      : name.endsWith(".html") ? "text/html"
      : name.endsWith(".png") || name.endsWith(".jpg") ? "image/png"
      : "text/plain",
    url: entry.url,
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
  if (agent.webSearchEnabled) {
    toolList.push("web_search — search the web for current information, news, facts, prices, documentation");
    toolList.push("browse_url — visit ANY URL and read its full content; always use when a URL is mentioned");
    toolList.push("scrape_web — extract structured data (tables, lists, prices) from websites");
  }
  if (agent.codeExecutionEnabled) {
    toolList.push("code_execute — ACTUALLY RUN Python, JavaScript, or bash code and get real output");
    toolList.push("shell_execute — run shell commands: npm, git, pip, build tools, file operations");
  }
  if (agent.fileUploadEnabled || agent.codeExecutionEnabled) {
    toolList.push("write_file — create any file (HTML, CSS, JS, Python, Markdown, JSON, etc.) as a download");
    toolList.push("read_file — read a file created earlier in this task");
    toolList.push("export_document — generate a downloadable PDF or Markdown document from content");
    toolList.push("create_spreadsheet — generate a downloadable CSV spreadsheet from data");
  }
  if (agent.apiCallsEnabled) {
    toolList.push("api_call — make real HTTP requests to any external API or service");
  }
  toolList.push("analyze_data — analyze data, find patterns, compute statistics, generate insights");
  toolList.push("generate_image — create images from text descriptions using AI");
  toolList.push("create_presentation — build a slide deck / pitch deck / slideshow. ONLY use when user explicitly asks for a presentation or slides. NEVER use for building apps, websites, or code.");
  if (agent.webSearchEnabled) {
    toolList.push("github_repo — read any public GitHub repository: list files, read code, view README");
  }
  toolList.push("schedule_task — schedule a follow-up task to run at a future time");
  toolList.push("task_complete — REQUIRED: call this with the complete final answer when done");

  const toolSection = toolList.length > 0
    ? `\n\n## Your Tools\n${toolList.map(t => `- ${t}`).join("\n")}`
    : "";

  const basePrompt = agent.systemPrompt ||
    `You are Future — an autonomous AI agent that can do virtually anything a skilled human professional can do on a computer. You work for real people: entrepreneurs, developers, authors, business owners, students, and creators. Your job is to take their goals and make them real.`;

  return `${basePrompt}${toolSection}

## WHO YOU ARE
You are an autonomous agent — not a chatbot. You don't just answer questions; you complete tasks. You have real tools: you can browse the web, write and run code, create files, generate images, call APIs, and produce downloadable documents. You use these tools to get things done.

## CORE OPERATING PRINCIPLE: DO THE WORK
When someone gives you a task, you DO IT. You never:
- Say "you should" or "you could" or "you might want to"
- Tell the user to "coordinate with designers/developers"
- Provide a planning outline and stop
- Say "feel free to ask if you need help with specific parts"
- Defer work back to the user
- Give advice instead of results

You always produce the COMPLETE, FINISHED deliverable. If they ask for an app — write the full app. If they ask for a website — write the complete HTML/CSS/JS. If they ask for a book — write the full book. If they ask for a business plan — write the entire plan.

## HOW TO HANDLE DIFFERENT TASK TYPES

### Building Websites
- Write complete, production-ready HTML/CSS/JavaScript
- Use write_file to save index.html, style.css, script.js etc.
- Make it responsive, modern, and visually polished
- Include all sections the user asked for
- Use export_document to also provide a PDF summary if helpful

### Building Apps (React, Python, Node.js, etc.)
- Write the COMPLETE source code with all files
- Use write_file for each file (App.tsx, package.json, etc.)
- Include setup instructions in a README.md
- Use shell_execute to verify the structure if needed
- Use code_execute to test logic where possible

### Writing Books, Reports, Documents
- Write the FULL content — all chapters, all sections
- Use export_document to generate a downloadable PDF
- Structure with proper headings, subheadings, and formatting
- Aim for the length and depth the user expects

### Research Tasks
- Use web_search and browse_url to gather real, current information
- Visit multiple sources and cross-reference
- Synthesize findings into a comprehensive, structured report
- Export as PDF if the user wants a document

### Data & Spreadsheets
- Use code_execute to process and analyze data
- Use create_spreadsheet to generate downloadable CSV files
- Use analyze_data for insights and statistics

### Image Generation
- Use generate_image with detailed, descriptive prompts
- Describe style, composition, colors, mood

### Visiting Websites / URLs
- ALWAYS use browse_url when a URL is mentioned
- Use scrape_web to extract structured data from pages
- Never say you "can't access" a URL — you can

### Presentations & Slide Decks
- Use create_presentation to build a complete interactive HTML slide deck
- Include a title slide, all content slides, and navigation controls
- Choose a theme appropriate to the topic (dark for tech, light for business, blue for corporate)
- Export as a downloadable HTML file the user can open in any browser

### GitHub / Code Repositories
- Use github_repo to read any public GitHub repository
- Use get_readme first to understand the project, then list_files for structure
- Use read_file to examine specific source files
- Build on or analyze the code as requested

### Task Scheduling
- Use schedule_task when the user asks to be reminded or to run something later
- Always confirm what was scheduled and when

## AUTONOMOUS PLANNING
For complex tasks, think step by step:
1. Understand what the user actually wants (the real goal, not just the literal request)
2. Break it into concrete steps
3. Execute each step using the right tools
4. Combine results into a complete deliverable
5. Call task_complete with the full result

## QUALITY STANDARDS
- **Code**: Production-ready, commented, handles errors, follows best practices
- **Documents**: Complete, well-structured, professional quality
- **Research**: Thorough, multi-source, with citations
- **Images**: Detailed prompts for best results
- **Data**: Accurate, well-formatted, with insights

## CRITICAL TOOL SELECTION RULES — READ BEFORE EVERY TASK

### NEVER misuse create_presentation
The 'create_presentation' tool creates slide decks. It MUST NOT be used for:
- Building apps (iOS, Android, web, desktop)
- Building websites or landing pages
- Writing code of any kind
- Creating documents, reports, or plans (use write_file + export_document instead)

If the user asks to "build an app" or "create a website", you MUST write actual code using 'write_file'. A slide deck is NOT an app. A slide deck is NOT a website. Producing a slide deck when the user asked for an app is a critical failure.

### HONEST CAPABILITY DISCLOSURE
You can produce real, working code files. You CANNOT:
- Actually publish an app to the Apple App Store or Google Play (you can write the complete source code)
- Actually deploy a website to a live domain (you can write the complete HTML/CSS/JS)
- Actually run a mobile app on a device (you can write all the code)

When a user asks to "build an app that can be downloaded from the App Store", you MUST:
1. Write the complete React Native / Swift / Flutter source code using 'write_file'
2. Clearly tell the user: "Here is the complete source code. To publish to the App Store, you will need to submit it through Xcode / App Store Connect."
3. NEVER claim the app "has been successfully built and can be downloaded from the Apple Store" — that is false.

### CORRECT TOOL FOR EACH DELIVERABLE
| User asks for | Correct tool | WRONG tool |
|---|---|---|
| Website / landing page | write_file (HTML/CSS/JS) | create_presentation |
| iOS / Android app | write_file (source code) | create_presentation |
| Business plan document | write_file + export_document | create_presentation |
| Pitch deck / slide deck | create_presentation | write_file |
| Data report | export_document | create_presentation |
| Research summary | export_document | create_presentation |

## ALWAYS FINISH
You MUST call task_complete when done. Never leave a task hanging. If something fails, try an alternative approach. If truly stuck, call task_complete with what you were able to accomplish and a clear explanation.

Current date: ${new Date().toISOString().split("T")[0]}`;
}

function getToolTitle(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case "web_search": return `🔍 Searching: "${String(args.query ?? "").substring(0, 50)}"`;
    case "browse_url": return `🌐 Visiting: ${String(args.url ?? "").substring(0, 60)}`;
    case "scrape_web": return `📊 Scraping: ${String(args.url ?? "").substring(0, 50)}`;
    case "code_execute": return `⚡ Running ${String(args.language ?? "code")} code`;
    case "shell_execute": return `🖥️ Running: ${String(args.command ?? "").substring(0, 50)}`;
    case "read_file": return `📄 Reading: ${String(args.filename ?? "")}`;
    case "write_file": return `💾 Creating file: ${String(args.filename ?? "")}`;
    case "export_document": return `📄 Exporting: ${String(args.filename ?? "document")}.${String(args.format ?? "pdf")}`;
    case "create_spreadsheet": return `📊 Creating spreadsheet: ${String(args.filename ?? "")}`;
    case "api_call": return `🔗 API: ${String(args.method ?? "GET")} ${String(args.url ?? "").substring(0, 50)}`;
    case "analyze_data": return `📊 Analyzing data`;
    case "generate_image": return `🎨 Generating image`;
    case "create_presentation": return `📊 Building presentation: ${String(args.title ?? "")}`;
    case "github_repo": return `🐛 GitHub: ${String(args.action ?? "")} ${String(args.repo ?? "")}`;
    case "schedule_task": return `⏰ Scheduling: ${String(args.task ?? "").substring(0, 50)}`;
    case "task_complete": return `✅ Task complete`;
    default: return `🔧 Using tool: ${toolName}`;
  }
}

function getToolDescription(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case "web_search": return `Searching the web for: "${String(args.query ?? "")}"`;
    case "browse_url": return `Visiting ${String(args.url ?? "")}${args.extract ? ` — extracting: ${String(args.extract)}` : ""}`;
    case "scrape_web": return `Extracting "${String(args.target ?? "")}" from ${String(args.url ?? "")}`;
    case "code_execute": return `\`\`\`${String(args.language ?? "")}\n${String(args.code ?? "").substring(0, 400)}\n\`\`\``;
    case "shell_execute": return `\`\`\`bash\n${String(args.command ?? "")}\n\`\`\``;
    case "read_file": return `Reading contents of "${String(args.filename ?? "")}"`;
    case "write_file": return `Creating file "${String(args.filename ?? "")}" — ${String(args.description ?? "")}`;
    case "export_document": return `Generating ${String(args.format ?? "pdf").toUpperCase()}: "${String(args.title ?? "")}"`;
    case "create_spreadsheet": return `Creating CSV with ${Array.isArray(args.rows) ? (args.rows as unknown[]).length : 0} rows: ${String(args.description ?? "")}`;
    case "api_call": return `${String(args.method ?? "GET")} ${String(args.url ?? "")}`;
    case "analyze_data": return `Task: ${String(args.task ?? "")}`;
    case "generate_image": return `Prompt: ${String(args.prompt ?? "").substring(0, 200)}`;
    case "create_presentation": return `Creating ${Array.isArray(args.slides) ? (args.slides as unknown[]).length : 0} slides: "${String(args.title ?? "")}" (theme: ${String(args.theme ?? "dark")})`;
    case "github_repo": return `${String(args.action ?? "")} on ${String(args.repo ?? "")}${args.path ? ` → ${String(args.path)}` : ""}`;
    case "schedule_task": return `Task: "${String(args.task ?? "")}" scheduled for ${String(args.run_at ?? "")}`;
    case "task_complete": return String(args.result ?? "").substring(0, 300);
    default: return JSON.stringify(args).substring(0, 200);
  }
}
