/**
 * Future AI Platform — Autonomous Agent Tool Registry
 *
 * Manus-parity tool set:
 *  - web_search       : DuckDuckGo + LLM fallback
 *  - browse_url       : real HTTP fetch + HTML strip
 *  - code_execute     : REAL execution via child_process (Python / JS / shell)
 *  - read_file        : in-task file store
 *  - write_file       : in-task file store + CDN upload
 *  - export_document  : Markdown → PDF via manus-md-to-pdf + CDN upload
 *  - create_spreadsheet: data → CSV + CDN upload
 *  - scrape_web       : structured data extraction from a URL
 *  - shell_execute    : run shell commands (npm, git, pip, etc.)
 *  - api_call         : HTTP requests to external services
 *  - analyze_data     : LLM-powered data analysis
 *  - generate_image   : AI image generation
 *  - task_complete    : signal task done + final answer
 */

import { invokeLLM } from "./_core/llm";
import { execSync, exec } from "child_process";
import { writeFileSync, readFileSync, existsSync, statSync, unlinkSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

// ─── Tool Definitions (JSON Schema for LLM) ──────────────────────────────────

export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description: "Search the web for current information, news, facts, documentation, or any topic. Returns relevant results with titles, snippets, and URLs.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
          num_results: { type: "number", description: "Number of results (1-10)", default: 5 },
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
      description: "Visit a URL and read the full content of the webpage. Use this whenever the user provides a URL, asks you to visit a website, or when you need to read specific page content after a web search.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The full URL to visit (http:// or https://)" },
          extract: { type: "string", description: "Optional: specific information to extract (e.g. 'pricing', 'contact info', 'main content')" },
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
      description: "Write and ACTUALLY RUN Python or JavaScript code. Use for calculations, data processing, generating charts, building scripts, creating files, or any computational task. Returns real stdout/stderr output.",
      parameters: {
        type: "object",
        properties: {
          language: { type: "string", enum: ["python", "javascript", "bash"], description: "Language to run" },
          code: { type: "string", description: "The code to execute" },
          description: { type: "string", description: "What this code does" },
        },
        required: ["language", "code", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "shell_execute",
      description: "Run shell commands: npm install, git clone, pip install, file operations, build commands, etc. Use for setting up projects, installing dependencies, or running build tools.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to run (e.g. 'npm init -y', 'pip install requests')" },
          description: { type: "string", description: "What this command does" },
          workdir: { type: "string", description: "Working directory (optional, defaults to /tmp)" },
        },
        required: ["command", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read the contents of a file created earlier in this task.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "File name to read" },
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
      description: "Create a file with content. Use for saving code, HTML, text, JSON, Markdown, or any output. The file becomes a downloadable artifact for the user.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "File name (e.g. 'app.py', 'index.html', 'report.md')" },
          content: { type: "string", description: "File content" },
          description: { type: "string", description: "What this file contains" },
        },
        required: ["filename", "content", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "export_document",
      description: "Export content as a downloadable PDF or Markdown document. Use for books, reports, business plans, documentation, essays, or any long-form content the user wants to download.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Document title" },
          content: { type: "string", description: "Full Markdown content of the document" },
          format: { type: "string", enum: ["pdf", "markdown"], description: "Output format", default: "pdf" },
          filename: { type: "string", description: "Output filename without extension (e.g. 'business-plan')" },
        },
        required: ["title", "content", "format", "filename"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_spreadsheet",
      description: "Create a downloadable CSV spreadsheet from data. Use for tables, reports, data exports, financial models, or any structured data.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "File name (e.g. 'budget.csv', 'report.csv')" },
          headers: { type: "array", items: { type: "string" }, description: "Column headers" },
          rows: { type: "array", items: { type: "array" }, description: "Data rows (array of arrays)" },
          description: { type: "string", description: "What this spreadsheet contains" },
        },
        required: ["filename", "headers", "rows", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "scrape_web",
      description: "Extract structured data from a website (tables, lists, prices, contact info, product details, etc.). More powerful than browse_url for data extraction tasks.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to scrape" },
          target: { type: "string", description: "What data to extract (e.g. 'all prices', 'contact information', 'product list', 'table data')" },
        },
        required: ["url", "target"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "api_call",
      description: "Make an HTTP API request to any external service. Supports GET, POST, PUT, DELETE.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The API endpoint URL" },
          method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"], default: "GET" },
          headers: { type: "object", description: "HTTP headers", additionalProperties: { type: "string" } },
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
      description: "Analyze data (CSV, JSON, tables, text) and produce insights, statistics, trends, or recommendations.",
      parameters: {
        type: "object",
        properties: {
          data: { type: "string", description: "The data to analyze" },
          task: { type: "string", description: "Analysis task (e.g. 'find trends', 'calculate statistics', 'compare values')" },
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
      description: "Generate an image from a text description using AI.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Detailed description of the image to generate" },
          style: { type: "string", description: "Art style (e.g. 'photorealistic', 'illustration', 'diagram', 'logo')", default: "photorealistic" },
        },
        required: ["prompt"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_presentation",
      description: "Create a downloadable HTML slide deck / presentation from an outline. Use for pitch decks, presentations, reports, or any slide-based content.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Presentation title" },
          slides: {
            type: "array",
            description: "Array of slides",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Slide title" },
                content: { type: "string", description: "Slide body content (bullet points, text, etc.)" },
                notes: { type: "string", description: "Speaker notes (optional)" },
              },
              required: ["title", "content"],
              additionalProperties: false,
            },
          },
          theme: { type: "string", enum: ["dark", "light", "blue", "minimal"], description: "Visual theme", default: "dark" },
          filename: { type: "string", description: "Output filename without extension" },
        },
        required: ["title", "slides", "filename"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_repo",
      description: "Read a public GitHub repository: list files, read file contents, view README, explore code structure.",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "GitHub repo in owner/repo format (e.g. 'vercel/next.js')" },
          action: { type: "string", enum: ["list_files", "read_file", "get_readme", "get_info"], description: "What to do" },
          path: { type: "string", description: "File path for read_file action (e.g. 'src/index.ts')" },
          branch: { type: "string", description: "Branch name (default: main)" },
        },
        required: ["repo", "action"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "schedule_task",
      description: "Schedule a follow-up task to run at a future time. Use when the user asks to be reminded, or to run something later.",
      parameters: {
        type: "object",
        properties: {
          task: { type: "string", description: "Description of what to do" },
          run_at: { type: "string", description: "ISO 8601 datetime string for when to run (e.g. '2026-04-18T09:00:00Z')" },
          notes: { type: "string", description: "Additional context or instructions" },
        },
        required: ["task", "run_at"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "task_complete",
      description: "REQUIRED: Call this when the task is fully done. Provide the complete final answer, result, or summary for the user.",
      parameters: {
        type: "object",
        properties: {
          result: { type: "string", description: "The complete final answer, result, or summary to present to the user" },
          artifacts: {
            type: "array",
            description: "List of files or outputs created",
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
  artifacts?: { name: string; content: string; type: string; url?: string }[];
}

// ─── In-memory file store for task sessions ───────────────────────────────────

const taskFileStore = new Map<string, Map<string, { content: string; url?: string }>>();

export function getTaskFiles(taskId: string): Map<string, { content: string; url?: string }> {
  if (!taskFileStore.has(taskId)) {
    taskFileStore.set(taskId, new Map());
  }
  return taskFileStore.get(taskId)!;
}

export function clearTaskFiles(taskId: string) {
  taskFileStore.delete(taskId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tmpPath(ext: string): string {
  return `/tmp/future_agent_${randomBytes(8).toString("hex")}${ext}`;
}

function uploadFile(filePath: string): string {
  try {
    const output = execSync(`manus-upload-file "${filePath}"`, { timeout: 60000 }).toString();
    const match = output.match(/CDN URL:\s*(https?:\/\/\S+)/);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

// ─── Tool Executors ───────────────────────────────────────────────────────────

async function executeWebSearch(args: { query: string; num_results?: number }): Promise<ToolResult> {
  try {
    const encoded = encodeURIComponent(args.query);
    const response = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`);
    const data = await response.json() as {
      AbstractText?: string;
      AbstractURL?: string;
      AbstractSource?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
      Answer?: string;
      Definition?: string;
    };

    const results: string[] = [];
    if (data.Answer) results.push(`**Instant Answer:** ${data.Answer}`);
    if (data.AbstractText) results.push(`**Summary (${data.AbstractSource}):** ${data.AbstractText}\n  URL: ${data.AbstractURL}`);
    if (data.Definition) results.push(`**Definition:** ${data.Definition}`);

    const topics = data.RelatedTopics ?? [];
    let count = 0;
    for (const topic of topics) {
      if (count >= (args.num_results ?? 5)) break;
      if (topic.Text && topic.FirstURL) { results.push(`• ${topic.Text}\n  URL: ${topic.FirstURL}`); count++; }
      else if (topic.Topics) {
        for (const sub of topic.Topics) {
          if (count >= (args.num_results ?? 5)) break;
          if (sub.Text && sub.FirstURL) { results.push(`• ${sub.Text}\n  URL: ${sub.FirstURL}`); count++; }
        }
      }
    }

    if (results.length === 0) {
      const llmResult = await invokeLLM({
        messages: [
          { role: "system", content: "You are a web search assistant. Provide factual search results. Format as numbered list with title, description, and source." },
          { role: "user", content: `Search results for: ${args.query}` },
        ],
      });
      const content = llmResult.choices?.[0]?.message?.content;
      return { success: true, output: typeof content === "string" ? content : `No results found for "${args.query}"` };
    }

    return { success: true, output: `**Search Results for "${args.query}":**\n\n${results.join("\n\n")}` };
  } catch (err) {
    return { success: false, output: "", error: `Search failed: ${String(err)}` };
  }
}

async function executeBrowseUrl(args: { url: string; extract?: string }): Promise<ToolResult> {
  try {
    let targetUrl = args.url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FutureAI-Agent/1.0)",
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { success: false, output: "", error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    let rawContent: string;
    if (contentType.includes("application/json")) {
      rawContent = JSON.stringify(await response.json(), null, 2);
    } else {
      rawContent = await response.text();
    }

    const textContent = rawContent
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/\s{3,}/g, "\n\n").trim();

    const truncated = textContent.length > 8000
      ? textContent.substring(0, 8000) + "\n\n... (content truncated)"
      : textContent;

    if (args.extract && truncated.length > 200) {
      const llmResult = await invokeLLM({
        messages: [
          { role: "system", content: "Extract exactly what is requested from the webpage content. Be precise and complete." },
          { role: "user", content: `Webpage content:\n\n${truncated}\n\nExtract: ${args.extract}` },
        ],
      });
      const extracted = llmResult.choices?.[0]?.message?.content;
      return { success: true, output: `**From ${targetUrl}** (${args.extract}):\n\n${typeof extracted === "string" ? extracted : truncated}` };
    }

    return { success: true, output: `**Content from ${targetUrl}:**\n\n${truncated}` };
  } catch (err) {
    return { success: false, output: "", error: `Failed to browse ${args.url}: ${String(err)}` };
  }
}

async function executeCodeExecution(
  args: { language: string; code: string; description: string },
  taskId: string
): Promise<ToolResult> {
  const tmpFile = tmpPath(args.language === "python" ? ".py" : args.language === "javascript" ? ".js" : ".sh");
  try {
    writeFileSync(tmpFile, args.code, "utf8");

    let cmd: string;
    if (args.language === "python") {
      cmd = `python3 "${tmpFile}"`;
    } else if (args.language === "javascript") {
      cmd = `node "${tmpFile}"`;
    } else {
      cmd = `bash "${tmpFile}"`;
    }

    const output = execSync(cmd, {
      timeout: 30000,
      maxBuffer: 1024 * 1024, // 1MB output limit
      env: { ...process.env, PYTHONPATH: "/usr/lib/python3/dist-packages" },
    }).toString();

    // Check if code wrote any files and store them
    const files = getTaskFiles(taskId);
    const artifacts: { name: string; content: string; type: string; url?: string }[] = [];

    // Look for file write patterns in the code
    const fileWriteMatches = args.code.match(/(?:open|to_csv|to_json|to_excel|savefig|write)\s*\(\s*['"]([^'"]+)['"]/g) ?? [];
    for (const match of fileWriteMatches) {
      const nameMatch = match.match(/['"]([^'"]+)['"]/);
      if (nameMatch) {
        const fname = nameMatch[1];
        const fpath = existsSync(fname) ? fname : existsSync(`/tmp/${fname}`) ? `/tmp/${fname}` : null;
        if (fpath) {
          const content = readFileSync(fpath).toString("base64");
          const url = uploadFile(fpath);
          files.set(fname, { content: `[binary file]`, url });
          artifacts.push({ name: fname, content, type: "application/octet-stream", url });
        }
      }
    }

    const truncatedOutput = output.length > 4000 ? output.substring(0, 4000) + "\n... (output truncated)" : output;

    return {
      success: true,
      output: `**Code executed successfully** (${args.description}):\n\`\`\`\n${truncatedOutput || "(no output)"}\n\`\`\``,
      artifacts,
    };
  } catch (err: unknown) {
    const execErr = err as { stdout?: Buffer; stderr?: Buffer; message?: string };
    const stderr = execErr.stderr?.toString() ?? execErr.message ?? String(err);
    const stdout = execErr.stdout?.toString() ?? "";
    return {
      success: false,
      output: `**Code execution failed:**\n\`\`\`\n${stderr}\n\`\`\`${stdout ? `\n\n**Partial output:**\n\`\`\`\n${stdout}\n\`\`\`` : ""}`,
      error: stderr,
    };
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

async function executeShellCommand(
  args: { command: string; description: string; workdir?: string }
): Promise<ToolResult> {
  // Blocklist dangerous commands
  const blocked = ["rm -rf /", "dd if=", "mkfs", "format", "> /dev/", "shutdown", "reboot", "passwd"];
  if (blocked.some(b => args.command.includes(b))) {
    return { success: false, output: "", error: "Command blocked for safety reasons." };
  }

  try {
    const output = execSync(args.command, {
      timeout: 60000,
      maxBuffer: 1024 * 512,
      cwd: args.workdir ?? "/tmp",
      env: { ...process.env },
    }).toString();

    const truncated = output.length > 3000 ? output.substring(0, 3000) + "\n... (truncated)" : output;
    return {
      success: true,
      output: `**Command:** \`${args.command}\`\n**Output:**\n\`\`\`\n${truncated || "(no output)"}\n\`\`\``,
    };
  } catch (err: unknown) {
    const execErr = err as { stdout?: Buffer; stderr?: Buffer; message?: string };
    const stderr = execErr.stderr?.toString() ?? execErr.message ?? String(err);
    return { success: false, output: `**Command failed:** \`${args.command}\`\n\`\`\`\n${stderr}\n\`\`\``, error: stderr };
  }
}

async function executeReadFile(args: { filename: string }, taskId: string): Promise<ToolResult> {
  const files = getTaskFiles(taskId);
  const entry = files.get(args.filename);
  if (!entry) {
    return { success: false, output: "", error: `File "${args.filename}" not found in task workspace` };
  }
  return { success: true, output: `**Contents of ${args.filename}:**\n\`\`\`\n${entry.content}\n\`\`\`` };
}

async function executeWriteFile(
  args: { filename: string; content: string; description: string },
  taskId: string
): Promise<ToolResult> {
  const files = getTaskFiles(taskId);
  const tmpFile = tmpPath("_" + args.filename.replace(/[^a-zA-Z0-9._-]/g, "_"));
  writeFileSync(tmpFile, args.content, "utf8");
  const url = uploadFile(tmpFile);
  files.set(args.filename, { content: args.content, url });
  try { unlinkSync(tmpFile); } catch { /* ignore */ }

  return {
    success: true,
    output: `✓ File **${args.filename}** created (${args.content.length.toLocaleString()} characters)${url ? `\n📥 [Download ${args.filename}](${url})` : ""}`,
    artifacts: [{ name: args.filename, content: args.content, type: "text/plain", url }],
  };
}

async function executeExportDocument(
  args: { title: string; content: string; format: string; filename: string },
  taskId: string
): Promise<ToolResult> {
  const files = getTaskFiles(taskId);
  const mdContent = `# ${args.title}\n\n${args.content}`;
  const safeFilename = args.filename.replace(/[^a-zA-Z0-9._-]/g, "-");

  if (args.format === "markdown") {
    const fname = `${safeFilename}.md`;
    const tmpFile = tmpPath(".md");
    writeFileSync(tmpFile, mdContent, "utf8");
    const url = uploadFile(tmpFile);
    files.set(fname, { content: mdContent, url });
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
    return {
      success: true,
      output: `✓ Document **${fname}** created${url ? `\n📥 [Download ${fname}](${url})` : ""}`,
      artifacts: [{ name: fname, content: mdContent, type: "text/markdown", url }],
    };
  }

  // PDF export
  const tmpMd = tmpPath(".md");
  const tmpPdf = tmpPath(".pdf");
  try {
    writeFileSync(tmpMd, mdContent, "utf8");
    execSync(`manus-md-to-pdf "${tmpMd}" "${tmpPdf}"`, { timeout: 60000 });
    const url = uploadFile(tmpPdf);
    const fname = `${safeFilename}.pdf`;
    files.set(fname, { content: `[PDF document]`, url });
    return {
      success: true,
      output: `✓ PDF **${fname}** generated (${statSync(tmpPdf).size.toLocaleString()} bytes)${url ? `\n📥 [Download ${fname}](${url})` : ""}`,
      artifacts: [{ name: fname, content: "[PDF]", type: "application/pdf", url }],
    };
  } catch (err) {
    return { success: false, output: "", error: `PDF export failed: ${String(err)}` };
  } finally {
    try { unlinkSync(tmpMd); } catch { /* ignore */ }
    try { unlinkSync(tmpPdf); } catch { /* ignore */ }
  }
}

async function executeCreateSpreadsheet(
  args: { filename: string; headers: string[]; rows: unknown[][]; description: string },
  taskId: string
): Promise<ToolResult> {
  const files = getTaskFiles(taskId);
  const csvLines = [
    args.headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","),
    ...args.rows.map(row =>
      row.map(cell => {
        const s = String(cell ?? "");
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ),
  ];
  const csvContent = csvLines.join("\n");
  const safeFilename = args.filename.endsWith(".csv") ? args.filename : `${args.filename}.csv`;

  const tmpFile = tmpPath(".csv");
  writeFileSync(tmpFile, csvContent, "utf8");
  const url = uploadFile(tmpFile);
  files.set(safeFilename, { content: csvContent, url });
  try { unlinkSync(tmpFile); } catch { /* ignore */ }

  return {
    success: true,
    output: `✓ Spreadsheet **${safeFilename}** created (${args.rows.length} rows × ${args.headers.length} columns)${url ? `\n📥 [Download ${safeFilename}](${url})` : ""}`,
    artifacts: [{ name: safeFilename, content: csvContent, type: "text/csv", url }],
  };
}

async function executeScrapeWeb(args: { url: string; target: string }): Promise<ToolResult> {
  // First browse the URL
  const browseResult = await executeBrowseUrl({ url: args.url });
  if (!browseResult.success) return browseResult;

  // Then use LLM to extract structured data
  const llmResult = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a web scraping assistant. Extract structured data from webpage content. Format the output as a clean, organized table or list. Be thorough and accurate.",
      },
      {
        role: "user",
        content: `From this webpage:\n\n${browseResult.output}\n\nExtract: ${args.target}\n\nFormat the data clearly with proper structure.`,
      },
    ],
  });
  const extracted = llmResult.choices?.[0]?.message?.content;
  return {
    success: true,
    output: `**Scraped from ${args.url}** (${args.target}):\n\n${typeof extracted === "string" ? extracted : browseResult.output}`,
  };
}

async function executeApiCall(
  args: { url: string; method?: string; headers?: Record<string, string>; body?: string }
): Promise<ToolResult> {
  try {
    const response = await fetch(args.url, {
      method: args.method ?? "GET",
      headers: { "Content-Type": "application/json", "User-Agent": "Future-AI-Agent/1.0", ...(args.headers ?? {}) },
      body: args.body,
      signal: AbortSignal.timeout(15000),
    });

    const contentType = response.headers.get("content-type") ?? "";
    let body: string;
    if (contentType.includes("application/json")) {
      body = JSON.stringify(await response.json(), null, 2);
    } else {
      body = await response.text();
      if (body.length > 3000) body = body.substring(0, 3000) + "\n... (truncated)";
    }

    return {
      success: response.ok,
      output: `**API Response (${response.status} ${response.statusText}):**\n\`\`\`json\n${body}\n\`\`\``,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    return { success: false, output: "", error: `API call failed: ${String(err)}` };
  }
}

async function executeAnalyzeData(args: { data: string; task: string }): Promise<ToolResult> {
  try {
    const llmResult = await invokeLLM({
      messages: [
        { role: "system", content: "You are a data analyst. Analyze the data precisely and present findings clearly with tables, statistics, and insights where appropriate." },
        { role: "user", content: `Data:\n${args.data}\n\nTask: ${args.task}` },
      ],
    });
    const content = llmResult.choices?.[0]?.message?.content;
    return { success: true, output: typeof content === "string" ? content : "Analysis complete" };
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
      output: `✓ Image generated\n![Generated Image](${url})`,
      artifacts: [{ name: "generated_image.png", content: url ?? "", type: "image/png", url: url ?? "" }],
    };
  } catch (err) {
    return { success: false, output: "", error: `Image generation failed: ${String(err)}` };
  }
}

// ─── New Tool Executors ──────────────────────────────────────────────────────

async function executeCreatePresentation(
  args: { title: string; slides: Array<{ title: string; content: string; notes?: string }>; theme?: string; filename: string },
  taskId: string
): Promise<ToolResult> {
  const files = getTaskFiles(taskId);
  const theme = args.theme ?? "dark";

  const themeStyles: Record<string, string> = {
    dark: "background:#1a1a2e;color:#eee;--accent:#7c3aed;",
    light: "background:#fff;color:#222;--accent:#2563eb;",
    blue: "background:#0f172a;color:#e2e8f0;--accent:#38bdf8;",
    minimal: "background:#f8f8f8;color:#333;--accent:#111;",
  };

  const style = themeStyles[theme] ?? themeStyles.dark;

  const slideHtml = args.slides.map((slide, i) => {
    const lines = slide.content.split("\n").filter(l => l.trim());
    const bullets = lines.map(l => `<li>${l.replace(/^[-*•]\s*/, "")}</li>`).join("\n");
    return `
    <div class="slide" id="slide-${i + 1}" style="display:${i === 0 ? "flex" : "none"}">
      <div class="slide-number">${i + 1} / ${args.slides.length}</div>
      <h2>${slide.title}</h2>
      <ul>${bullets}</ul>
      ${slide.notes ? `<div class="notes">📝 ${slide.notes}</div>` : ""}
    </div>`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${args.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; ${style} height: 100vh; overflow: hidden; }
    .container { width: 100%; height: 100vh; position: relative; }
    .slide { display: none; flex-direction: column; justify-content: center; padding: 60px 80px; height: 100vh; position: relative; }
    .slide.active { display: flex; }
    .slide-number { position: absolute; top: 20px; right: 30px; opacity: 0.5; font-size: 14px; }
    h1.main-title { font-size: 3rem; text-align: center; margin-bottom: 1rem; color: var(--accent); }
    h2 { font-size: 2rem; margin-bottom: 1.5rem; color: var(--accent); }
    ul { list-style: none; padding: 0; }
    ul li { padding: 10px 0; font-size: 1.25rem; padding-left: 1.5rem; position: relative; }
    ul li::before { content: '▸'; position: absolute; left: 0; color: var(--accent); }
    .notes { position: absolute; bottom: 20px; left: 80px; right: 80px; font-size: 0.85rem; opacity: 0.5; font-style: italic; }
    .nav { position: fixed; bottom: 30px; right: 40px; display: flex; gap: 12px; }
    .nav button { background: var(--accent); color: #fff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    .nav button:hover { opacity: 0.85; }
    .progress { position: fixed; bottom: 0; left: 0; height: 4px; background: var(--accent); transition: width 0.3s; }
    .title-slide { align-items: center; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="slide title-slide" id="slide-0" style="display:flex">
      <div class="slide-number">1 / ${args.slides.length + 1}</div>
      <h1 class="main-title">${args.title}</h1>
    </div>
    ${slideHtml}
    <div class="nav">
      <button onclick="prev()">← Prev</button>
      <button onclick="next()">Next →</button>
    </div>
    <div class="progress" id="progress"></div>
  </div>
  <script>
    let current = 0;
    const total = ${args.slides.length + 1};
    function show(n) {
      document.querySelectorAll('.slide').forEach((s, i) => s.style.display = i === n ? 'flex' : 'none');
      document.getElementById('progress').style.width = ((n + 1) / total * 100) + '%';
      current = n;
    }
    function next() { if (current < total - 1) show(current + 1); }
    function prev() { if (current > 0) show(current - 1); }
    document.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'Space') next(); if (e.key === 'ArrowLeft') prev(); });
    show(0);
  </script>
</body>
</html>`;

  const fname = `${args.filename.replace(/[^a-zA-Z0-9._-]/g, "-")}.html`;
  const tmpFile = tmpPath(".html");
  writeFileSync(tmpFile, html, "utf8");
  const url = uploadFile(tmpFile);
  files.set(fname, { content: html, url });
  try { unlinkSync(tmpFile); } catch { /* ignore */ }

  return {
    success: true,
    output: `✓ Presentation **${fname}** created with ${args.slides.length + 1} slides${url ? `\n📥 [Open/Download Presentation](${url})` : ""}`,
    artifacts: [{ name: fname, content: html, type: "text/html", url }],
  };
}

async function executeGithubRepo(
  args: { repo: string; action: string; path?: string; branch?: string }
): Promise<ToolResult> {
  const branch = args.branch ?? "main";
  const baseUrl = `https://api.github.com/repos/${args.repo}`;
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Future-AI-Agent/1.0",
  };

  try {
    if (args.action === "get_info") {
      const res = await fetch(baseUrl, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) return { success: false, output: "", error: `GitHub API: ${res.status} ${res.statusText}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, output: `**${args.repo}**\n⭐ ${data.stargazers_count} stars | 🍴 ${data.forks_count} forks | ${data.language}\n\n${data.description}\n\nDefault branch: ${data.default_branch}\nLast updated: ${data.updated_at}` };
    }

    if (args.action === "get_readme") {
      const res = await fetch(`${baseUrl}/readme`, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) return { success: false, output: "", error: `No README found` };
      const data = await res.json() as { content?: string };
      const content = Buffer.from(data.content ?? "", "base64").toString("utf8");
      return { success: true, output: `**README for ${args.repo}:**\n\n${content.substring(0, 6000)}${content.length > 6000 ? "\n... (truncated)" : ""}` };
    }

    if (args.action === "list_files") {
      const treePath = args.path ? `${baseUrl}/contents/${args.path}` : `${baseUrl}/git/trees/${branch}?recursive=1`;
      const res = await fetch(treePath, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) return { success: false, output: "", error: `GitHub API: ${res.status}` };
      const data = await res.json() as { tree?: Array<{ path: string; type: string }> } | Array<{ name: string; type: string }>;
      if (Array.isArray(data)) {
        const items = data.map((f: { name: string; type: string }) => `${f.type === "dir" ? "📁" : "📄"} ${f.name}`).join("\n");
        return { success: true, output: `**Files in ${args.repo}/${args.path ?? ""}:**\n${items}` };
      }
      const tree = (data as { tree?: Array<{ path: string; type: string }> }).tree ?? [];
      const files = tree.filter(f => f.type === "blob").map(f => f.path).slice(0, 100).join("\n");
      return { success: true, output: `**File tree for ${args.repo}:**\n${files}` };
    }

    if (args.action === "read_file") {
      if (!args.path) return { success: false, output: "", error: "path is required for read_file" };
      const res = await fetch(`${baseUrl}/contents/${args.path}?ref=${branch}`, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) return { success: false, output: "", error: `File not found: ${args.path}` };
      const data = await res.json() as { content?: string; encoding?: string; size?: number };
      if (data.encoding === "base64" && data.content) {
        const content = Buffer.from(data.content, "base64").toString("utf8");
        const truncated = content.length > 6000 ? content.substring(0, 6000) + "\n... (truncated)" : content;
        return { success: true, output: `**${args.path}** (${data.size} bytes):\n\`\`\`\n${truncated}\n\`\`\`` };
      }
      return { success: false, output: "", error: "Could not decode file content" };
    }

    return { success: false, output: "", error: `Unknown action: ${args.action}` };
  } catch (err) {
    return { success: false, output: "", error: `GitHub API failed: ${String(err)}` };
  }
}

async function executeScheduleTask(
  args: { task: string; run_at: string; notes?: string },
  userId: number
): Promise<ToolResult> {
  try {
    const { getDb } = await import("./db");
    const { scheduledTasks } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) return { success: false, output: "", error: "Database not available" };

    const runAt = new Date(args.run_at);
    if (isNaN(runAt.getTime())) return { success: false, output: "", error: `Invalid datetime: ${args.run_at}` };

    await db.insert(scheduledTasks).values({
      userId,
      agentId: 0, // no specific agent for user-scheduled tasks
      title: args.task.substring(0, 512),
      prompt: args.notes ? `${args.task}\n\nNotes: ${args.notes}` : args.task,
      scheduledFor: runAt,
      status: "pending",
    });

    const formatted = runAt.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" });
    return { success: true, output: `✓ Task scheduled for **${formatted} UTC**:\n"${args.task}"` };
  } catch (err) {
    return { success: false, output: "", error: `Scheduling failed: ${String(err)}` };
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
      return executeCodeExecution(toolArgs as { language: string; code: string; description: string }, taskId);

    case "shell_execute":
      return executeShellCommand(toolArgs as { command: string; description: string; workdir?: string });

    case "read_file":
      return executeReadFile(toolArgs as { filename: string }, taskId);

    case "write_file":
      return executeWriteFile(toolArgs as { filename: string; content: string; description: string }, taskId);

    case "export_document":
      return executeExportDocument(
        toolArgs as { title: string; content: string; format: string; filename: string },
        taskId
      );

    case "create_spreadsheet":
      return executeCreateSpreadsheet(
        toolArgs as { filename: string; headers: string[]; rows: unknown[][]; description: string },
        taskId
      );

    case "scrape_web":
      return executeScrapeWeb(toolArgs as { url: string; target: string });

    case "api_call":
      return executeApiCall(toolArgs as { url: string; method?: string; headers?: Record<string, string>; body?: string });

    case "analyze_data":
      return executeAnalyzeData(toolArgs as { data: string; task: string });

    case "generate_image":
      return executeGenerateImage(toolArgs as { prompt: string; style?: string });

    case "create_presentation":
      return executeCreatePresentation(
        toolArgs as { title: string; slides: Array<{ title: string; content: string; notes?: string }>; theme?: string; filename: string },
        taskId
      );

    case "github_repo":
      return executeGithubRepo(toolArgs as { repo: string; action: string; path?: string; branch?: string });

    case "schedule_task":
      return executeScheduleTask(toolArgs as { task: string; run_at: string; notes?: string }, 0);

    case "task_complete":
      return {
        success: true,
        output: (toolArgs.result as string) ?? "Task completed.",
        artifacts: (toolArgs.artifacts as string[] | undefined)?.map(a => ({
          name: String(a),
          content: "",
          type: "text/plain",
        })) ?? [],
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
      case "web_search":
      case "browse_url":
      case "scrape_web":
        return agent.webSearchEnabled;
      case "code_execute":
      case "shell_execute":
        return agent.codeExecutionEnabled;
      case "read_file":
      case "write_file":
      case "export_document":
      case "create_spreadsheet":
        return agent.fileUploadEnabled || agent.codeExecutionEnabled;
      case "api_call":
        return agent.apiCallsEnabled;
      case "analyze_data":
      case "generate_image":
      case "create_presentation":
      case "task_complete":
        return true; // always available
      case "github_repo":
        return agent.webSearchEnabled; // needs internet access
      case "schedule_task":
        return true; // always available
      default:
        return false;
    }
  });
}
