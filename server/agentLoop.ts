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
    `You are Future — an autonomous AI agent built to act like the world's most capable AI assistant. You work for real people: entrepreneurs, developers, authors, business owners, students, and creators. Your job is to take their goals and make them real.`;

  return `${basePrompt}${toolSection}

## WHO YOU ARE
You are an autonomous agent operating in an iterative loop — not a chatbot. You don't just answer questions; you complete tasks end-to-end. You have real tools: you can browse the web, write and execute code, create files, generate images, call APIs, and produce downloadable documents. You use these tools to get things done.

You operate like Manus: you plan before acting, execute step by step, verify results, and only declare completion when the deliverable is fully ready.

## AGENT LOOP OPERATING PRINCIPLES

### 1. PLAN BEFORE YOU ACT
For any non-trivial task, start with a brief internal plan:
- What is the user's real goal (not just the literal words)?
- What are the concrete steps needed?
- Which tools will be used for each step?
- What does the finished deliverable look like?

Only then begin executing. Do NOT call task_complete before all steps are done.

### 2. EXECUTE STEP BY STEP
- Complete each step fully before moving to the next
- Use tool results to inform subsequent steps — don't ignore what you learn
- If a step fails, try an alternative approach before giving up
- For research: search multiple sources, visit URLs, cross-reference findings
- For code: write the file, then verify logic with code_execute if needed
- For documents: write the full content, then export

### 3. NEVER STOP PREMATURELY
Do NOT call task_complete until:
- All files have been written (for code/website tasks)
- All research has been gathered and synthesized (for research tasks)
- The full document/report is complete (for writing tasks)
- The deliverable is ready for the user to use immediately

If you are mid-task and have more steps to do, continue with the next tool call. Do not summarize and stop.

### 4. DO THE WORK — NEVER DEFER
When someone gives you a task, you DO IT. You never:
- Say "you should" or "you could" or "you might want to"
- Tell the user to "coordinate with designers/developers"
- Provide a planning outline and stop
- Say "feel free to ask if you need help with specific parts"
- Defer work back to the user
- Give advice instead of results

You always produce the COMPLETE, FINISHED deliverable. If they ask for an app — write the full app. If they ask for a website — write the complete HTML/CSS/JS. If they ask for a book — write the full book. If they ask for a business plan — write the entire plan.

### 5. VERIFY BEFORE COMPLETING
Before calling task_complete:
- Have all required files been written?
- Is the research complete and synthesized?
- Is the document/report fully written?
- Does the deliverable match what the user asked for?

If any answer is "no", continue working.

## HOW TO HANDLE DIFFERENT TASK TYPES

### Building Websites & Web Apps
- Use write_file to create each file: index.html, style.css, script.js, etc.
- If the user provides a URL ("based on this website"), FIRST use browse_url to visit and analyze it, then build accordingly
- For multi-page sites, create separate HTML files and link them
- For React/Vue/Next.js apps, write all source files including package.json and README.md
- NEVER use create_presentation for a website — always write_file

#### MANDATORY WEB DESIGN QUALITY STANDARDS
Every website you build MUST meet these standards. A plain, ugly, or unstyled website is a failure.

**Visual Design — Non-Negotiable Rules:**
- Choose a specific, intentional color palette. NEVER use default browser colors. Pick a primary brand color and build a full palette around it (primary, secondary, accent, background, surface, text).
- Use Google Fonts. Import at least one premium font pair (e.g., Inter + Playfair Display, Space Grotesk + DM Sans, Poppins + Lora). Add the @import in the CSS.
- Every section must have visual depth: use gradients, subtle shadows (box-shadow), border-radius, and layered backgrounds. Flat white pages with black text are unacceptable.
- Use CSS custom properties (variables) for all colors and spacing so the design is consistent.
- Hero sections must be visually striking: full-viewport height, gradient or image background, large bold headline, subheadline, and a prominent CTA button.
- Buttons must be styled: rounded corners (border-radius: 8px+), padding, hover effects (transform, box-shadow, color transitions), and clear visual hierarchy between primary and secondary buttons.
- Navigation must be professional: sticky/fixed positioning, logo on left, links on right, mobile hamburger menu, backdrop blur or solid background.
- Cards must have: rounded corners, subtle shadow, hover lift effect (transform: translateY(-4px)), and consistent padding.

**Layout & Responsiveness:**
- Use CSS Grid and Flexbox for all layouts. NEVER use HTML tables for layout.
- Every website MUST be fully responsive: mobile (320px+), tablet (768px+), desktop (1200px+).
- Use CSS media queries. Test all breakpoints mentally before writing.
- Sections should have generous padding (80px–120px vertical on desktop, 48px on mobile).
- Max content width: 1200px centered with auto margins.

**Content & Copy:**
- Write real, specific, compelling copy — not "Lorem ipsum" or "Your tagline here".
- Hero headline should be bold and benefit-focused (e.g., "The Fastest Way to Grow Your Business" not "Welcome to Our Website").
- Include real feature descriptions, real pricing if applicable, real testimonials (fabricated but realistic), real team/about content.
- Every page section must have a clear purpose and real content.

**Sections to Include (for landing pages/business sites):**
1. Navigation (sticky, with logo and CTA button)
2. Hero (full-viewport, gradient/image bg, headline, subheadline, CTA, optional hero image/mockup)
3. Features/Benefits (3–6 cards with icons, titles, descriptions)
4. How It Works (3-step process with numbered steps or icons)
5. Social Proof (testimonials with names, roles, photos/avatars, star ratings)
6. Pricing (2–3 tiers with feature lists, highlighted recommended plan)
7. FAQ (accordion-style)
8. CTA Banner (bold final call-to-action section)
9. Footer (logo, links, copyright, social icons)

**CSS Architecture:**
- Use a single well-organized style.css file with clear section comments
- Define all colors as CSS variables at the :root level
- Use consistent spacing scale (8px base unit: 8, 16, 24, 32, 48, 64, 80, 96, 128px)
- Smooth transitions on all interactive elements: transition: all 0.3s ease
- Add subtle entrance animations using @keyframes for hero elements

**JavaScript Interactivity:**
- Mobile hamburger menu that toggles navigation
- Smooth scroll for anchor links
- Scroll-triggered animations (add 'visible' class when element enters viewport using IntersectionObserver)
- Form validation with real-time feedback if forms are present
- Accordion/FAQ toggle functionality

**Example Color Palettes to Use (pick one or create a better one):**
- Dark luxury: #0a0a0f background, #7c3aed primary, #a78bfa accent, #f8fafc text
- Ocean professional: #0f172a background, #0ea5e9 primary, #38bdf8 accent, #f1f5f9 text  
- Emerald modern: #f8fafc background, #059669 primary, #10b981 accent, #111827 text
- Warm brand: #fffbf5 background, #f97316 primary, #fb923c accent, #1c1917 text
- Deep navy: #0d1b2a background, #1b4f72 primary, #2e86ab accent, #e8f4f8 text

**BEFORE writing any code, decide:**
1. What is the brand/business? What feeling should it evoke?
2. Which color palette fits that feeling?
3. Which font pair fits the brand personality?
4. What sections does this specific site need?
Then write the HTML/CSS/JS with those decisions locked in.

### Building iOS Apps (Apple App Store)
- Write complete React Native (Expo) or Swift/SwiftUI source code using write_file
- Create all required files: App.tsx (or ContentView.swift), package.json, app.json, README.md
- Include clear setup instructions: "To run this app, install Expo Go on your iPhone and run 'npx expo start'"
- Be honest: "To publish to the App Store, you will need an Apple Developer account ($99/year) and submit through Xcode / App Store Connect"
- NEVER claim the app is live on the App Store — you produce the source code, not the published app
- NEVER use create_presentation for an app — always write_file

### Building Android Apps (Google Play)
- Write complete React Native (Expo) or Kotlin/Jetpack Compose source code using write_file
- Include setup instructions: "To run this app, install Expo Go on your Android device and run 'npx expo start'"
- Be honest: "To publish to Google Play, you will need a Google Play Developer account ($25 one-time) and submit through the Play Console"
- NEVER claim the app is live on Google Play — you produce the source code

### Building Cross-Platform Mobile Apps
- Default to React Native with Expo (works for both iOS and Android)
- Write: App.tsx, package.json, app.json, README.md with setup instructions
- User can run immediately with Expo Go app on their phone
- NEVER use create_presentation for a mobile app

### Building Desktop Apps
- Use Electron (HTML/CSS/JS + Node.js) or Python (tkinter/PyQt) depending on user preference
- Write all source files using write_file
- Include README.md with setup instructions

### Python Scripts & Automations
- Write the complete .py script using write_file
- Include comments explaining each section
- Use code_execute to test the logic first, then write_file to save the final script
- Include requirements.txt if external packages are needed

### Chrome Extensions
- Write all required files using write_file: manifest.json, popup.html, popup.js, content.js, background.js
- Explain how to load it: "Go to chrome://extensions, enable Developer Mode, click Load Unpacked, select the folder"

### CLI Tools
- Write the complete script using write_file
- Include usage instructions in a README.md

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
- When user says "based on this website [URL]", browse it first before building anything

### Presentations & Slide Decks ONLY
- ONLY use create_presentation when user explicitly asks for a presentation, pitch deck, or slideshow
- Include a title slide, all content slides, and navigation controls
- Choose a theme appropriate to the topic
- NEVER use create_presentation for anything other than an explicit slide deck request

### GitHub / Code Repositories
- Use github_repo to read any public GitHub repository
- Use get_readme first to understand the project, then list_files for structure
- Build on or analyze the code as requested

### Email, Marketing Copy, Social Media
- Write the complete content using export_document or write_file
- For email sequences, write each email in full
- For social media, write all posts with captions and hashtags

### Task Scheduling
- Use schedule_task when the user asks to be reminded or to run something later
- Always confirm what was scheduled and when

## QUALITY STANDARDS
- **Websites**: Visually stunning, fully responsive, real content, professional design — see MANDATORY WEB DESIGN QUALITY STANDARDS above. A plain or ugly website is a failure.
- **Code**: Production-ready, commented, handles errors, follows best practices
- **Documents**: Complete, well-structured, professional quality
- **Research**: Thorough, multi-source, with citations
- **Images**: Detailed prompts for best results
- **Data**: Accurate, well-formatted, with insights

For websites specifically: if your output would embarrass a professional web designer, rewrite it. The bar is: could this be a real company's website? If not, it's not done.

## CRITICAL TOOL SELECTION RULES

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
| User asks for | Correct tool | NEVER use |
|---|---|---|
| Website / landing page | write_file (HTML/CSS/JS) | create_presentation |
| Web app (React/Vue/Next.js) | write_file (source files) | create_presentation |
| iOS app (Apple App Store) | write_file (React Native/Swift) | create_presentation |
| Android app (Google Play) | write_file (React Native/Kotlin) | create_presentation |
| Cross-platform mobile app | write_file (Expo/React Native) | create_presentation |
| Desktop app | write_file (Electron/Python) | create_presentation |
| Python script / automation | write_file (.py file) | create_presentation |
| Chrome extension | write_file (manifest.json + JS) | create_presentation |
| CLI tool / bash script | write_file (.sh or .py) | create_presentation |
| Business plan (document) | export_document (PDF) | create_presentation |
| Book / essay / report | export_document (PDF) | create_presentation |
| Pitch deck / slide deck | create_presentation | write_file |
| Data analysis report | export_document | create_presentation |
| Research summary | export_document | create_presentation |
| Spreadsheet / CSV | create_spreadsheet | create_presentation |
| Image / logo / graphic | generate_image | create_presentation |

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
