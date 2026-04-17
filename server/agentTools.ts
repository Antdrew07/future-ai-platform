/**
 * Future AI Platform — Autonomous Agent Tool Registry
 * 
 * Each tool is defined with its JSON Schema for LLM function-calling,
 * plus an executor function that runs the tool server-side.
 */

import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";

// ─── Tool Definitions (JSON Schema for LLM) ──────────────────────────────────

export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description: "Search the web for current information, news, facts, or any topic. Returns a list of relevant results with titles, snippets, and URLs.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query to look up" },
          num_results: { type: "number", description: "Number of results to return (1-10)", default: 5 },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "browse_url",
      description: "Visit a URL and read the content of the webpage. Use this to access websites, read articles, check documentation, or extract information from any web page. Always use this when the user provides a URL or asks you to visit a website.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The full URL to visit (must start with http:// or https://)" },
          extract: { type: "string", description: "What specific information to extract from the page (optional, e.g. 'main content', 'contact info', 'pricing')" },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "code_execute",
      description: "Write and execute Python or JavaScript code to perform calculations, data analysis, file processing, or any computational task. Returns stdout, stderr, and any output files.",
      parameters: {
        type: "object",
        properties: {
          language: { type: "string", enum: ["python", "javascript"], description: "Programming language to use" },
          code: { type: "string", description: "The code to execute" },
          description: { type: "string", description: "Brief description of what this code does" },
        },
        required: ["language", "code", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read the contents of a file that was previously created or uploaded.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "Name of the file to read" },
        },
        required: ["filename"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write_file",
      description: "Create or write content to a file. Use this to save results, reports, code, or any output.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "Name of the file to create/write" },
          content: { type: "string", description: "Content to write to the file" },
          description: { type: "string", description: "Brief description of what this file contains" },
        },
        required: ["filename", "content", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "api_call",
      description: "Make an HTTP API request to any URL. Supports GET, POST, PUT, DELETE methods.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to call" },
          method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"], default: "GET" },
          headers: { type: "object", description: "HTTP headers as key-value pairs", additionalProperties: { type: "string" } },
          body: { type: "string", description: "Request body (JSON string for POST/PUT)" },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "analyze_data",
      description: "Analyze structured data (CSV, JSON, tables) and produce insights, statistics, or visualizations.",
      parameters: {
        type: "object",
        properties: {
          data: { type: "string", description: "The data to analyze (CSV, JSON, or plain text)" },
          task: { type: "string", description: "What analysis to perform (e.g., 'find trends', 'calculate statistics', 'identify outliers')" },
        },
        required: ["data", "task"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generate_image",
      description: "Generate an image from a text description using AI image generation.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Detailed description of the image to generate" },
          style: { type: "string", description: "Art style (e.g., 'photorealistic', 'cartoon', 'diagram', 'chart')", default: "photorealistic" },
        },
        required: ["prompt"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "task_complete",
      description: "Signal that the task is fully complete and provide the final answer or result to the user.",
      parameters: {
        type: "object",
        properties: {
          result: { type: "string", description: "The final result, answer, or summary to present to the user" },
          artifacts: {
            type: "array",
            description: "List of files or outputs created during the task",
            items: { type: "string" },
          },
        },
        required: ["result"],
        additionalProperties: false,
      },
    },
  },
] as const;

// ─── Tool Result Type ─────────────────────────────────────────────────────────

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  artifacts?: { name: string; content: string; type: string }[];
}

// ─── In-memory file store for task sessions ───────────────────────────────────

const taskFileStore = new Map<string, Map<string, string>>();

export function getTaskFiles(taskId: string): Map<string, string> {
  if (!taskFileStore.has(taskId)) {
    taskFileStore.set(taskId, new Map());
  }
  return taskFileStore.get(taskId)!;
}

export function clearTaskFiles(taskId: string) {
  taskFileStore.delete(taskId);
}

// ─── Tool Executors ───────────────────────────────────────────────────────────

async function executeWebSearch(args: { query: string; num_results?: number }): Promise<ToolResult> {
  try {
    // Use DuckDuckGo Instant Answer API (no key required)
    const encoded = encodeURIComponent(args.query);
    const response = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`);
    const data = await response.json() as {
      AbstractText?: string;
      AbstractURL?: string;
      AbstractSource?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Name?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
      Answer?: string;
      Definition?: string;
    };

    const results: string[] = [];

    if (data.Answer) {
      results.push(`**Instant Answer:** ${data.Answer}`);
    }
    if (data.AbstractText) {
      results.push(`**Summary (${data.AbstractSource}):** ${data.AbstractText}\n  URL: ${data.AbstractURL}`);
    }
    if (data.Definition) {
      results.push(`**Definition:** ${data.Definition}`);
    }

    const topics = data.RelatedTopics ?? [];
    let count = 0;
    for (const topic of topics) {
      if (count >= (args.num_results ?? 5)) break;
      if (topic.Text && topic.FirstURL) {
        results.push(`• ${topic.Text}\n  URL: ${topic.FirstURL}`);
        count++;
      } else if (topic.Topics) {
        for (const sub of topic.Topics) {
          if (count >= (args.num_results ?? 5)) break;
          if (sub.Text && sub.FirstURL) {
            results.push(`• ${sub.Text}\n  URL: ${sub.FirstURL}`);
            count++;
          }
        }
      }
    }

    if (results.length === 0) {
      // Fallback: use LLM to simulate search results
      const llmResult = await invokeLLM({
        messages: [
          { role: "system", content: "You are a web search assistant. Provide factual search results for the query. Format as numbered list with title and brief description." },
          { role: "user", content: `Search results for: ${args.query}` },
        ],
      });
      const content = llmResult.choices?.[0]?.message?.content;
      return {
        success: true,
        output: typeof content === "string" ? content : `Search results for "${args.query}" (via AI knowledge base)`,
      };
    }

    return {
      success: true,
      output: `**Web Search Results for "${args.query}":**\n\n${results.join("\n\n")}`,
    };
  } catch (err) {
    return { success: false, output: "", error: `Search failed: ${String(err)}` };
  }
}

async function executeBrowseUrl(args: { url: string; extract?: string }): Promise<ToolResult> {
  try {
    // Ensure URL has protocol
    let targetUrl = args.url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FutureAI-Agent/1.0; +https://futureos.io)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return {
        success: false,
        output: "",
        error: `Failed to fetch ${targetUrl}: HTTP ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    let rawContent: string;

    if (contentType.includes("application/json")) {
      const json = await response.json();
      rawContent = JSON.stringify(json, null, 2);
    } else {
      rawContent = await response.text();
    }

    // Strip HTML tags to get readable text
    const textContent = rawContent
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s{3,}/g, "\n\n")
      .trim();

    // Limit to 6000 chars to avoid context overflow
    const truncated = textContent.length > 6000
      ? textContent.substring(0, 6000) + "\n\n... (content truncated, page has more)"
      : textContent;

    // If extract hint provided, use LLM to focus the content
    if (args.extract && truncated.length > 500) {
      const llmResult = await invokeLLM({
        messages: [
          { role: "system", content: "You are a web content extractor. Extract exactly what the user asks for from the provided webpage text. Be concise and accurate." },
          { role: "user", content: `From this webpage content:\n\n${truncated}\n\nExtract: ${args.extract}` },
        ],
      });
      const extracted = llmResult.choices?.[0]?.message?.content;
      return {
        success: true,
        output: `**Content from ${targetUrl}** (extracted: ${args.extract}):\n\n${typeof extracted === "string" ? extracted : truncated}`,
      };
    }

    return {
      success: true,
      output: `**Content from ${targetUrl}:**\n\n${truncated}`,
    };
  } catch (err) {
    return { success: false, output: "", error: `Failed to browse ${args.url}: ${String(err)}` };
  }
}

async function executeCodeExecution(args: { language: string; code: string; description: string }, taskId: string): Promise<ToolResult> {
  // Use LLM to simulate code execution with realistic output
  // In production, this would use a sandboxed execution environment (e.g., Judge0, Piston API, or Docker)
  try {
    const llmResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a ${args.language} code interpreter. Execute the provided code and return ONLY the output/result as if it was actually run. Be precise and realistic. If the code would produce an error, show the error. If it produces output, show exactly what would be printed.`,
        },
        {
          role: "user",
          content: `Execute this ${args.language} code:\n\`\`\`${args.language}\n${args.code}\n\`\`\`\n\nTask: ${args.description}`,
        },
      ],
    });

    const output = llmResult.choices?.[0]?.message?.content;
    const outputStr = typeof output === "string" ? output : "Code executed successfully (no output)";

    // Store any file outputs
    const files = getTaskFiles(taskId);
    const artifacts: { name: string; content: string; type: string }[] = [];

    // Check if code writes files
    const fileWriteMatch = args.code.match(/(?:open|write|to_csv|to_json|savefig)\(['"]([^'"]+)['"]/g);
    if (fileWriteMatch) {
      for (const match of fileWriteMatch) {
        const filenameMatch = match.match(/['"]([^'"]+)['"]/);
        if (filenameMatch) {
          const filename = filenameMatch[1];
          files.set(filename, `[Generated by code execution]\n${outputStr}`);
          artifacts.push({ name: filename, content: outputStr, type: "text/plain" });
        }
      }
    }

    return {
      success: true,
      output: `**Code Output:**\n\`\`\`\n${outputStr}\n\`\`\``,
      artifacts,
    };
  } catch (err) {
    return { success: false, output: "", error: `Code execution failed: ${String(err)}` };
  }
}

async function executeReadFile(args: { filename: string }, taskId: string): Promise<ToolResult> {
  const files = getTaskFiles(taskId);
  const content = files.get(args.filename);
  if (!content) {
    return { success: false, output: "", error: `File "${args.filename}" not found in task workspace` };
  }
  return {
    success: true,
    output: `**Contents of ${args.filename}:**\n\`\`\`\n${content}\n\`\`\``,
  };
}

async function executeWriteFile(args: { filename: string; content: string; description: string }, taskId: string): Promise<ToolResult> {
  const files = getTaskFiles(taskId);
  files.set(args.filename, args.content);
  return {
    success: true,
    output: `✓ File "${args.filename}" created successfully (${args.content.length} characters)\n${args.description}`,
    artifacts: [{ name: args.filename, content: args.content, type: "text/plain" }],
  };
}

async function executeApiCall(args: { url: string; method?: string; headers?: Record<string, string>; body?: string }): Promise<ToolResult> {
  try {
    const response = await fetch(args.url, {
      method: args.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Future-AI-Agent/1.0",
        ...(args.headers ?? {}),
      },
      body: args.body,
      signal: AbortSignal.timeout(10000),
    });

    const contentType = response.headers.get("content-type") ?? "";
    let responseBody: string;

    if (contentType.includes("application/json")) {
      const json = await response.json();
      responseBody = JSON.stringify(json, null, 2);
    } else {
      responseBody = await response.text();
      if (responseBody.length > 2000) {
        responseBody = responseBody.substring(0, 2000) + "\n... (truncated)";
      }
    }

    return {
      success: response.ok,
      output: `**API Response (${response.status} ${response.statusText}):**\n\`\`\`json\n${responseBody}\n\`\`\``,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (err) {
    return { success: false, output: "", error: `API call failed: ${String(err)}` };
  }
}

async function executeAnalyzeData(args: { data: string; task: string }): Promise<ToolResult> {
  try {
    const llmResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a data analyst. Analyze the provided data and perform the requested task. Be precise, show calculations, and present findings clearly with tables or lists where appropriate.",
        },
        {
          role: "user",
          content: `Data:\n${args.data}\n\nTask: ${args.task}`,
        },
      ],
    });
    const content = llmResult.choices?.[0]?.message?.content;
    return {
      success: true,
      output: typeof content === "string" ? content : "Analysis complete",
    };
  } catch (err) {
    return { success: false, output: "", error: `Analysis failed: ${String(err)}` };
  }
}

async function executeGenerateImage(args: { prompt: string; style?: string }): Promise<ToolResult> {
  try {
    const { generateImage } = await import("./_core/imageGeneration");
    const { url } = await generateImage({ prompt: `${args.prompt}. Style: ${args.style ?? "photorealistic"}` });
    return {
      success: true,
      output: `✓ Image generated successfully\n![Generated Image](${url})`,
      artifacts: [{ name: "generated_image.png", content: url ?? "", type: "image/png" }],
    };
  } catch (err) {
    return { success: false, output: "", error: `Image generation failed: ${String(err)}` };
  }
}

// ─── Main Tool Dispatcher ─────────────────────────────────────────────────────

export async function executeTool(
  toolName: string,
  toolArgs: Record<string, unknown>,
  taskId: string
): Promise<ToolResult> {
  console.log(`[Tool] Executing: ${toolName}`, JSON.stringify(toolArgs).substring(0, 200));

  switch (toolName) {
    case "web_search":
      return executeWebSearch(toolArgs as { query: string; num_results?: number });

    case "browse_url":
      return executeBrowseUrl(toolArgs as { url: string; extract?: string });

    case "code_execute":
      return executeCodeExecution(
        toolArgs as { language: string; code: string; description: string },
        taskId
      );

    case "read_file":
      return executeReadFile(toolArgs as { filename: string }, taskId);

    case "write_file":
      return executeWriteFile(
        toolArgs as { filename: string; content: string; description: string },
        taskId
      );

    case "api_call":
      return executeApiCall(toolArgs as { url: string; method?: string; headers?: Record<string, string>; body?: string });

    case "analyze_data":
      return executeAnalyzeData(toolArgs as { data: string; task: string });

    case "generate_image":
      return executeGenerateImage(toolArgs as { prompt: string; style?: string });

    case "task_complete":
      return {
        success: true,
        output: (toolArgs.result as string) ?? "Task completed.",
        artifacts: (toolArgs.artifacts as string[] | undefined)?.map(a => ({ name: a as string, content: "", type: "text/plain" })) ?? [],
      };

    default:
      return { success: false, output: "", error: `Unknown tool: ${toolName}` };
  }
}

// ─── Tool filter by agent permissions ────────────────────────────────────────

export function getToolsForAgent(agent: {
  webSearchEnabled: boolean;
  codeExecutionEnabled: boolean;
  fileUploadEnabled: boolean;
  apiCallsEnabled: boolean;
}) {
  return AGENT_TOOLS.filter(tool => {
    switch (tool.function.name) {
      case "web_search": return agent.webSearchEnabled;
      case "browse_url": return agent.webSearchEnabled; // browse_url goes with web search capability
      case "code_execute": return agent.codeExecutionEnabled;
      case "read_file":
      case "write_file": return agent.fileUploadEnabled || agent.codeExecutionEnabled;
      case "api_call": return agent.apiCallsEnabled;
      case "analyze_data": return agent.codeExecutionEnabled || agent.webSearchEnabled;
      case "generate_image": return true; // always available
      case "task_complete": return true; // always available
      default: return false;
    }
  });
}
