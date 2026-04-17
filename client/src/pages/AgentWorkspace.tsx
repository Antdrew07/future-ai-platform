/**
 * Future AI Platform — Agent Workspace
 *
 * Manus-style split-pane layout:
 * - Desktop: LEFT = conversation chat, RIGHT = execution log + live browser view
 * - Mobile:  Tab-based switching between Chat and Execution Log
 *            Input box is always pinned to the bottom of the screen
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Bot, Send, Loader2, Search, Code2, FileText, Globe, Zap,
  CheckCircle2, XCircle, ChevronDown, ChevronRight, Copy,
  Download, ArrowLeft, Sparkles, Terminal, Image, Database,
  AlertCircle, Cpu, Clock, Coins, Plus, MessageSquare, Activity,
  Eye, ExternalLink, Monitor, ShoppingCart, MonitorPlay, X,
  Maximize2, Minimize2, RefreshCw, ZoomIn
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocation as useWouterLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentStep {
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
  // Browserbase session info (attached to browse_url/browse_web tool calls)
  browserSessionId?: string;
  browserLiveViewUrl?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  taskId?: number;
  creditsUsed?: number;
  timestamp: number;
  steps?: AgentStep[];
  status?: "running" | "complete" | "error";
}

// ─── Domain Upsell Component ─────────────────────────────────────────────────

/**
 * Shown after a website build completes. A dismissible suggestion card —
 * never blocks the user from continuing their work.
 */
function DomainUpsell({ prompt: _prompt }: { prompt: string }) {
  const [, navigate] = useWouterLocation();
  const [dismissed, setDismissed] = useState(false);
  // Use a fixed generic search — never derive domain names from the user's chat query
  const searchQuery = "myapp";
  const { data, isLoading } = trpc.domains.search.useQuery(
    { query: searchQuery },
    { enabled: !!searchQuery }
  );

  const available = data?.results.filter(r => r.available).slice(0, 3) ?? [];

  if (isLoading || dismissed || available.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span className="text-xs font-semibold text-primary">Give your site a real home</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 -mt-0.5"
          aria-label="Dismiss domain suggestion"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-2.5">
        Buy a domain and we'll automatically connect everything — DNS, hosting, the works. No setup needed.
      </p>
      <div className="space-y-1.5">
        {available.map(d => (
          <div key={d.domain} className="flex items-center justify-between rounded-lg bg-background border border-border px-3 py-2">
            <span className="text-sm font-medium text-foreground">{d.domain}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">${d.price}/yr</span>
              <button
                onClick={() => navigate(`/dashboard/domains?search=${encodeURIComponent(searchQuery)}`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <ShoppingCart className="w-3 h-3" />
                Get it
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="mt-2.5 text-xs text-muted-foreground hover:text-foreground w-full text-center transition-colors"
      >
        No thanks, I'll skip this
      </button>
    </div>
  );
}

// ─── HTML Detection Helpers ──────────────────────────────────────────────────

/**
 * Returns the raw HTML string if the content looks like a website,
 * otherwise returns null.
 *
 * Handles three cases:
 *  1. The entire message is a full HTML document (starts with <!DOCTYPE or <html)
 *  2. The message contains a fenced ```html ... ``` code block
 *  3. The message contains a large inline HTML snippet (>200 chars, has <body>)
 */
function extractHtml(content: string): string | null {
  const trimmed = content.trim();

  // Case 1: bare HTML document
  if (/^<!doctype\s+html/i.test(trimmed) || /^<html/i.test(trimmed)) {
    return trimmed;
  }

  // Case 2: fenced code block  ```html ... ```
  const fenced = trimmed.match(/```html\s*\n([\s\S]*?)\n?```/i);
  if (fenced) return fenced[1].trim();

  // Case 3: large inline HTML with structural tags
  if (
    trimmed.length > 300 &&
    /<html[\s>]/i.test(trimmed) &&
    /<\/html>/i.test(trimmed)
  ) {
    const start = trimmed.search(/<html[\s>]/i);
    const end = trimmed.lastIndexOf("</html>") + "</html>".length;
    return trimmed.slice(start, end);
  }

  return null;
}

// ─── HTML Preview Component ───────────────────────────────────────────────────

function HtmlPreviewMessage({
  html,
  fullContent,
}: {
  html: string;
  fullContent: string;
}) {
  const [view, setView] = useState<"preview" | "code">("preview");

  const openInTab = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    // revoke after a short delay so the tab has time to load
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(html);
    toast.success("HTML copied to clipboard");
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Website Preview</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Preview / Code toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("preview")}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                view === "preview"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <Eye className="w-3 h-3 inline mr-1" />
              Preview
            </button>
            <button
              onClick={() => setView("code")}
              className={`px-2.5 py-1 text-xs font-medium transition-colors border-l border-border ${
                view === "code"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <Code2 className="w-3 h-3 inline mr-1" />
              Code
            </button>
          </div>
          <button
            onClick={openInTab}
            title="Open in new tab"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={copyCode}
            title="Copy HTML"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview pane */}
      {view === "preview" && (
        <div className="relative bg-white" style={{ height: "420px" }}>
          <iframe
            srcDoc={html}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
            title="Website preview"
          />
        </div>
      )}

      {/* Code pane */}
      {view === "code" && (
        <pre className="text-xs text-gray-700 bg-gray-950 text-green-300 p-4 overflow-auto max-h-[420px] font-mono whitespace-pre-wrap">
          {html}
        </pre>
      )}

      {/* Footer hint */}
      <div className="px-3 py-2 bg-gray-50 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Your website is ready — click Open to view full screen
        </span>
        <button
          onClick={openInTab}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open full screen
        </button>
      </div>
    </div>
  );
}

// ─── Smart Message Renderer ───────────────────────────────────────────────────

function AssistantMessageContent({ content }: { content: string }) {
  const html = extractHtml(content);

  if (html) {
    // If there is text before/after the HTML block, show it too
    const htmlBlockStart = content.indexOf(html.slice(0, 40));
    const preText = htmlBlockStart > 0 ? content.slice(0, htmlBlockStart).trim() : "";
    return (
      <div className="space-y-3">
        {preText && (
          <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed">
            <Streamdown>{preText}</Streamdown>
          </div>
        )}
        <HtmlPreviewMessage html={html} fullContent={content} />
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed">
      <Streamdown>{content}</Streamdown>
    </div>
  );
}

// ─── Tool Icons ───────────────────────────────────────────────────────────────

function getToolIcon(toolName?: string) {
  switch (toolName) {
    case "web_search": return <Search className="w-3.5 h-3.5 text-blue-500" />;
    case "code_execute": return <Code2 className="w-3.5 h-3.5 text-emerald-500" />;
    case "read_file":
    case "write_file": return <FileText className="w-3.5 h-3.5 text-amber-500" />;
    case "api_call": return <Globe className="w-3.5 h-3.5 text-violet-500" />;
    case "analyze_data": return <Database className="w-3.5 h-3.5 text-cyan-500" />;
    case "generate_image": return <Image className="w-3.5 h-3.5 text-pink-500" />;
    case "task_complete": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case "browse_url":
    case "browse_web": return <MonitorPlay className="w-3.5 h-3.5 text-indigo-500" />;
    case "scrape_web": return <Database className="w-3.5 h-3.5 text-cyan-500" />;
    case "shell_execute": return <Terminal className="w-3.5 h-3.5 text-orange-500" />;
    case "export_document": return <FileText className="w-3.5 h-3.5 text-amber-500" />;
    case "create_spreadsheet": return <Database className="w-3.5 h-3.5 text-green-500" />;
    default: return <Zap className="w-3.5 h-3.5 text-orange-500" />;
  }
}

function getStepIcon(step: AgentStep) {
  if (step.isError) return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  switch (step.type) {
    case "thinking": return <Cpu className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />;
    case "tool_call": return getToolIcon(step.toolName);
    case "tool_result": return step.isError ? <XCircle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case "complete": return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
    case "error": return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    default: return <Bot className="w-3.5 h-3.5 text-blue-500" />;
  }
}

function getStepColors(step: AgentStep) {
  if (step.isError) return { border: "border-red-200", bg: "bg-red-50" };
  switch (step.type) {
    case "thinking": return { border: "border-indigo-200", bg: "bg-indigo-50/60" };
    case "tool_call": return { border: "border-blue-200", bg: "bg-blue-50/60" };
    case "tool_result": return step.isError
      ? { border: "border-red-200", bg: "bg-red-50" }
      : { border: "border-emerald-200", bg: "bg-emerald-50/60" };
    case "complete": return { border: "border-amber-200", bg: "bg-amber-50/60" };
    case "error": return { border: "border-red-200", bg: "bg-red-50" };
    default: return { border: "border-border", bg: "bg-white" };
  }
}

// ─── Tool Result Renderers ────────────────────────────────────────────────────

function SearchResultRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const results: { title: string; snippet: string; url: string }[] = [];
  let current: { title: string; snippet: string; url: string } | null = null;
  for (const line of lines) {
    const titleMatch = line.match(/^\[\d+\]\s*Title:\s*(.+)/);
    const snippetMatch = line.match(/^\s*Snippet:\s*(.+)/);
    const urlMatch = line.match(/^\s*URL:\s*(.+)/);
    if (titleMatch) {
      if (current) results.push(current);
      current = { title: titleMatch[1], snippet: "", url: "" };
    } else if (snippetMatch && current) {
      current.snippet = snippetMatch[1];
    } else if (urlMatch && current) {
      current.url = urlMatch[1];
    }
  }
  if (current) results.push(current);
  if (results.length === 0) {
    return <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap">{content.slice(0, 400)}</div>;
  }
  return (
    <div className="space-y-1.5">
      {results.slice(0, 4).map((r, i) => (
        <div key={i} className="rounded-lg bg-blue-50 border border-blue-200 p-2">
          <p className="text-xs font-semibold text-blue-700 truncate">{r.title}</p>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{r.snippet}</p>
          {r.url && (
            <a href={r.url} target="_blank" rel="noreferrer"
              className="text-xs text-blue-500 hover:underline truncate block mt-0.5">
              {r.url.slice(0, 55)}{r.url.length > 55 ? "..." : ""}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function CodeOutputRenderer({ content, toolName }: { content: string; toolName?: string }) {
  const codeContent = content.replace(/```\w*\n?/g, "").replace(/```/g, "").trim();
  return (
    <div className="rounded-lg overflow-hidden border border-emerald-200">
      <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border-b border-emerald-200">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-emerald-600" />
          <span className="text-xs text-emerald-700">{toolName === "code_execute" ? "Output" : "Code"}</span>
        </div>
        <button className="text-xs text-gray-400 hover:text-gray-600"
          onClick={() => navigator.clipboard.writeText(codeContent)}>
          <Copy className="w-3 h-3" />
        </button>
      </div>
      <pre className="text-xs text-gray-700 bg-gray-50 p-3 overflow-x-auto max-h-40 font-mono whitespace-pre-wrap">
        {codeContent.slice(0, 1500)}{codeContent.length > 1500 ? "\n... (truncated)" : ""}
      </pre>
    </div>
  );
}

function StepContentRenderer({ step }: { step: AgentStep }) {
  const { toolName, content, type } = step;
  if (toolName === "web_search" && type === "tool_result") return <SearchResultRenderer content={content} />;
  if ((toolName === "code_execute" || (content.includes("```") && type === "tool_call")) && content.trim())
    return <CodeOutputRenderer content={content} toolName={toolName} />;
  if (toolName === "api_call" && type === "tool_result") {
    let pretty = content;
    try { pretty = JSON.stringify(JSON.parse(content), null, 2); } catch { /* not JSON */ }
    return (
      <pre className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-lg p-3 overflow-x-auto max-h-40 font-mono whitespace-pre-wrap">
        {pretty.slice(0, 1000)}{pretty.length > 1000 ? "\n... (truncated)" : ""}
      </pre>
    );
  }
  return (
    <div className="text-sm text-gray-700 prose prose-sm max-w-none">
      <Streamdown>{content}</Streamdown>
    </div>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────

function StepCard({
  step,
  isLast,
  onShowBrowser,
}: {
  step: AgentStep;
  isLast?: boolean;
  onShowBrowser?: (sessionId: string, liveViewUrl: string) => void;
}) {
  const [expanded, setExpanded] = useState(
    step.type === "complete" || step.type === "error" || (isLast === true && step.type !== "thinking")
  );
  const colors = getStepColors(step);
  const hasBrowserSession = !!(step.browserSessionId && step.browserLiveViewUrl);

  useEffect(() => {
    if (step.type === "complete" || step.type === "error") setExpanded(true);
  }, [step.type]);

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all duration-200`}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="shrink-0 w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-border shadow-sm">
          {getStepIcon(step)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{step.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
            {new Date(step.timestamp).toLocaleTimeString()}
          </p>
        </div>
        {/* Live browser badge */}
        {hasBrowserSession && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowBrowser?.(step.browserSessionId!, step.browserLiveViewUrl!);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-700 text-[10px] font-medium hover:bg-indigo-200 transition-colors shrink-0"
          >
            <MonitorPlay className="w-3 h-3" />
            Watch Live
          </button>
        )}
        {step.type === "thinking" ? (
          <div className="flex gap-1 items-center px-2 py-1 rounded-full bg-indigo-100 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && step.content && (
        <div className="px-4 pb-4 border-t border-black/5">
          <div className="mt-3">
            <StepContentRenderer step={step} />
          </div>
          {step.artifacts && step.artifacts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {step.artifacts.map((artifact, i) => (
                <button key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-100 transition-all"
                  onClick={() => {
                    // Prefer CDN URL for binary files (PDFs, images, CSVs)
                    if (artifact.url) {
                      const a = document.createElement("a");
                      a.href = artifact.url;
                      a.download = artifact.name;
                      a.target = "_blank";
                      a.click();
                      return;
                    }
                    const isHtml = artifact.name.endsWith(".html") || artifact.type === "text/html";
                    if (isHtml) {
                      const blob = new Blob([artifact.content], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      window.open(url, "_blank");
                      setTimeout(() => URL.revokeObjectURL(url), 5000);
                    } else {
                      const blob = new Blob([artifact.content], { type: artifact.type });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = artifact.name; a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}>
                  {artifact.name.endsWith(".html") ? <Eye className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                  {artifact.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Live Browser Panel ───────────────────────────────────────────────────────

/**
 * Shows a live Browserbase session iframe so users can watch the agent
 * work in a real browser in real time.
 */
function LiveBrowserPanel({
  sessionId,
  liveViewUrl,
  onClose,
}: {
  sessionId: string;
  liveViewUrl: string;
  onClose: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Poll session status every 10s to know when it ends
  const { data: sessionStatus } = trpc.browser.getSession.useQuery(
    { sessionId },
    { refetchInterval: 10000, retry: false }
  );

  const isActive = !sessionStatus || sessionStatus.status === "active" || sessionStatus.status === "running";

  return (
    <div className={`
      rounded-xl border border-indigo-200 overflow-hidden shadow-sm
      ${isExpanded ? "fixed inset-4 z-50 shadow-2xl" : ""}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 border-b border-indigo-200">
        <div className="flex items-center gap-2">
          <MonitorPlay className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-800">Live Browser</span>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isActive
              ? "bg-emerald-100 border border-emerald-300 text-emerald-700"
              : "bg-gray-100 border border-gray-300 text-gray-600"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            {isActive ? "Live" : "Ended"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIframeKey(k => k + 1)}
            title="Refresh"
            className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={liveViewUrl}
            target="_blank"
            rel="noreferrer"
            title="Open in new tab"
            className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => setIsExpanded(e => !e)}
            title={isExpanded ? "Minimize" : "Expand"}
            className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-lg hover:bg-red-100 text-indigo-500 hover:text-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Browser iframe */}
      <div
        className={`bg-white relative ${isExpanded ? "h-[calc(100%-44px)]" : "h-[360px]"}`}
      >
        {isActive ? (
          <iframe
            key={iframeKey}
            src={liveViewUrl}
            className="w-full h-full border-0"
            title="Live browser session"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MonitorPlay className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Browser session ended</p>
            <p className="text-xs text-muted-foreground/60 mt-1">The agent has finished browsing</p>
          </div>
        )}

        {/* Loading overlay while iframe loads */}
        {isActive && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-indigo-50/80 pointer-events-none"
            style={{ opacity: 0, transition: "opacity 0.5s" }}
            onLoad={(e) => {
              (e.currentTarget as HTMLDivElement).style.opacity = "0";
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <span className="text-xs text-indigo-600">Connecting to live browser...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-indigo-50 border-t border-indigo-200 flex items-center justify-between">
        <span className="text-[10px] text-indigo-600 font-mono truncate max-w-[200px]">
          Session: {sessionId.slice(0, 12)}...
        </span>
        <a
          href={liveViewUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-indigo-600 hover:underline font-medium"
        >
          Open full screen →
        </a>
      </div>
    </div>
  );
}

// ─── Chat Panel Content ───────────────────────────────────────────────────────

function ChatPanelContent({
  messages,
  isRunning,
  agent,
  input,
  setInput,
  runTask,
  inputRef,
  chatEndRef,
}: {
  messages: ChatMessage[];
  isRunning: boolean;
  agent: { name?: string | null; description?: string | null } | undefined;
  input: string;
  setInput: (v: string) => void;
  runTask: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runTask();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !isRunning && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              {agent?.name ?? "AI Agent"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
              {agent?.description ?? "Your personal AI. Ask it anything or give it a task to complete."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {[
                "Build me an iPhone app",
                "Write a business plan",
                "Research the latest trends",
                "Create a marketing strategy",
              ].map(s => (
                <button key={s}
                  className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5">
          {messages.map((msg, idx) => {
            // Detect if the previous user message was a website build request
            const prevUser = messages.slice(0, idx).reverse().find(m => m.role === "user");
            const isWebsiteBuild = msg.role === "assistant" && msg.status === "complete" &&
              prevUser && /build|create|make|website|landing page|web app|homepage/i.test(prevUser.content);
            return (
              <div key={msg.id}>
                <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3"
                      : "bg-gray-50 border border-border rounded-2xl rounded-tl-sm px-4 py-3"
                  }`}>
                    {msg.role === "assistant" ? (
                      <AssistantMessageContent content={msg.content} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.role === "assistant" && msg.creditsUsed && msg.creditsUsed > 0 ? (
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Coins className="w-2.5 h-2.5" />
                        {msg.creditsUsed} credits · {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    ) : null}
                    {/* Domain upsell after website builds */}
                    {isWebsiteBuild && prevUser && (
                      <DomainUpsell prompt={prevUser.content} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator while running */}
          {isRunning && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-gray-50 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={chatEndRef} />
      </div>

      {/* ── Input Box — always visible at bottom ── */}
      <div className="shrink-0 p-3 border-t border-border bg-white">
        <div className="flex items-end gap-2 bg-gray-50 border border-border rounded-2xl px-4 py-3 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRunning ? "Agent is working..." : "Message your agent..."}
            rows={1}
            disabled={isRunning}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[24px] max-h-[120px] leading-relaxed disabled:opacity-50"
            style={{ height: "auto" }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <Button
            size="icon"
            className="h-9 w-9 bg-primary hover:bg-primary/90 rounded-xl shrink-0"
            onClick={runTask}
            disabled={!input.trim() || isRunning}
          >
            {isRunning
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5 hidden sm:block">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ─── Preview Panel ────────────────────────────────────────────────────────────

/**
 * Renders the latest artifact visually:
 * - image/png → full <img> preview
 * - text/html or .html filename → iframe preview
 * - text/plain with HTML content → iframe preview
 * - everything else → code block
 */
function ArtifactPreview({ artifact }: { artifact: { name: string; content: string; type: string } }) {
  const [lightbox, setLightbox] = useState(false);

  // Image: content is a URL
  if (artifact.type === "image/png" || artifact.type === "image/jpeg" || artifact.type.startsWith("image/")) {
    return (
      <div className="flex flex-col items-center gap-3 p-4">
        <div className="relative group cursor-zoom-in" onClick={() => setLightbox(true)}>
          <img
            src={artifact.content}
            alt={artifact.name}
            className="max-w-full rounded-xl border border-border shadow-md object-contain"
            style={{ maxHeight: "calc(100vh - 280px)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
            <div className="bg-white/90 rounded-full p-2">
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={artifact.content}
            download={artifact.name}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-3 h-3" />
            Download
          </a>
          <a
            href={artifact.content}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open full size
          </a>
        </div>
        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <img
              src={artifact.content}
              alt={artifact.name}
              className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setLightbox(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // HTML: render in iframe
  const isHtml = artifact.type === "text/html" ||
    artifact.name.endsWith(".html") ||
    (artifact.type === "text/plain" && /<html[\s>]/i.test(artifact.content));

  if (isHtml) {
    const openInTab = () => {
      const blob = new Blob([artifact.content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-border shrink-0">
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">{artifact.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={openInTab} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              <ExternalLink className="w-3 h-3" />
              Open full screen
            </button>
          </div>
        </div>
        <div className="flex-1 bg-white">
          <iframe
            srcDoc={artifact.content}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
            title={artifact.name}
          />
        </div>
      </div>
    );
  }

  // Code / text fallback
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />{artifact.name}
        </span>
        <button
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          onClick={() => navigator.clipboard.writeText(artifact.content)}
        >
          <Copy className="w-3 h-3" /> Copy
        </button>
      </div>
      <pre className="text-xs bg-gray-950 text-green-300 rounded-xl p-4 overflow-auto max-h-[calc(100vh-280px)] font-mono whitespace-pre-wrap">
        {artifact.content.slice(0, 8000)}{artifact.content.length > 8000 ? "\n... (truncated)" : ""}
      </pre>
    </div>
  );
}

// ─── Right Panel (Tabs: Log | Preview | Live Browser) ─────────────────────────

function LogPanelContent({
  liveSteps,
  isRunning,
  runStatus,
  allArtifacts,
  stepsEndRef,
  activeBrowserSession,
  onShowBrowser,
  onCloseBrowser,
}: {
  liveSteps: AgentStep[];
  isRunning: boolean;
  runStatus: string;
  allArtifacts: { name: string; content: string; type: string }[];
  stepsEndRef: React.RefObject<HTMLDivElement | null>;
  activeBrowserSession: { sessionId: string; liveViewUrl: string } | null;
  onShowBrowser: (sessionId: string, liveViewUrl: string) => void;
  onCloseBrowser: () => void;
}) {
  // Track which tab is active — auto-switch to Preview when new artifacts arrive
  const [activeTab, setActiveTab] = useState<"log" | "preview" | "browser">("log");
  const prevArtifactCount = useRef(0);

  useEffect(() => {
    const imageArtifacts = allArtifacts.filter(a => a.type.startsWith("image/"));
    const htmlArtifacts = allArtifacts.filter(a =>
      a.type === "text/html" || a.name.endsWith(".html") ||
      (a.type === "text/plain" && /<html[\s>]/i.test(a.content))
    );
    const previewable = imageArtifacts.length + htmlArtifacts.length;
    if (previewable > prevArtifactCount.current) {
      setActiveTab("preview");
    }
    prevArtifactCount.current = previewable;
  }, [allArtifacts]);

  // Auto-switch to browser tab when session starts
  useEffect(() => {
    if (activeBrowserSession) setActiveTab("browser");
  }, [activeBrowserSession]);

  // Determine the best artifact to preview (latest image or HTML)
  const previewArtifact = [...allArtifacts].reverse().find(a =>
    a.type.startsWith("image/") ||
    a.type === "text/html" ||
    a.name.endsWith(".html") ||
    (a.type === "text/plain" && /<html[\s>]/i.test(a.content))
  ) ?? (allArtifacts.length > 0 ? allArtifacts[allArtifacts.length - 1] : null);

  const imageArtifacts = allArtifacts.filter(a => a.type.startsWith("image/"));
  const hasPreview = !!previewArtifact;
  const hasBrowser = !!activeBrowserSession;

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={v => setActiveTab(v as "log" | "preview" | "browser")}
        className="flex flex-col h-full"
      >
        {/* Tab bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-white shrink-0">
          <TabsList className="h-8 p-0.5 gap-0.5">
            <TabsTrigger value="log" className="h-7 px-3 text-xs gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Log
              {runStatus !== "idle" && (
                <span className={`w-1.5 h-1.5 rounded-full ml-0.5 ${
                  runStatus === "running" ? "bg-emerald-500 animate-pulse" :
                  runStatus === "complete" ? "bg-emerald-500" :
                  runStatus === "error" ? "bg-red-500" : ""
                }`} />
              )}
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-7 px-3 text-xs gap-1.5" disabled={!hasPreview}>
              <Eye className="w-3.5 h-3.5" />
              Preview
              {imageArtifacts.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[9px] font-bold">
                  {imageArtifacts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="browser" className="h-7 px-3 text-xs gap-1.5" disabled={!hasBrowser}>
              <MonitorPlay className="w-3.5 h-3.5" />
              Browser
              {hasBrowser && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse ml-0.5" />
              )}
            </TabsTrigger>
          </TabsList>
          {liveSteps.length > 0 && (
            <span className="text-xs text-muted-foreground">{liveSteps.length} steps</span>
          )}
        </div>

        {/* ── Execution Log Tab ── */}
        <TabsContent value="log" className="flex-1 overflow-hidden m-0">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              {liveSteps.length === 0 && !isRunning && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
                    <Terminal className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Execution steps will appear here</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Send a message to see your agent work in real-time</p>
                </div>
              )}
              {(liveSteps.length > 0 || isRunning) && (
                <div className="space-y-2">
                  {liveSteps.map((step, idx) => (
                    <StepCard
                      key={step.id}
                      step={step}
                      isLast={idx === liveSteps.length - 1}
                      onShowBrowser={(sid, url) => {
                        onShowBrowser(sid, url);
                        setActiveTab("browser");
                      }}
                    />
                  ))}
                  {isRunning && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/60">
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                      <span className="text-sm text-indigo-700">Agent is working...</span>
                    </div>
                  )}
                  <div ref={stepsEndRef} />
                </div>
              )}
            </div>
            {/* Output files strip */}
            {allArtifacts.length > 0 && (
              <div className="border-t border-border bg-white px-4 py-2.5 shrink-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-foreground">Output Files ({allArtifacts.length})</span>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className="ml-auto text-xs text-primary hover:underline"
                  >
                    View Preview →
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allArtifacts.map((artifact, i) => (
                    <button key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-100 transition-all"
                      onClick={() => {
                        if (artifact.type.startsWith("image/")) {
                          setActiveTab("preview");
                          return;
                        }
                        const isHtml = artifact.name.endsWith(".html") || artifact.type === "text/html";
                        if (isHtml) {
                          setActiveTab("preview");
                          return;
                        }
                        const blob = new Blob([artifact.content], { type: artifact.type });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = artifact.name; a.click();
                        URL.revokeObjectURL(url);
                      }}>
                      {artifact.type.startsWith("image/") ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      {artifact.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Preview Tab ── */}
        <TabsContent value="preview" className="flex-1 overflow-hidden m-0">
          {!hasPreview ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
                <Eye className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No preview yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Generated images and websites will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* If multiple images, show a filmstrip at top */}
              {imageArtifacts.length > 1 && (
                <div className="flex gap-2 px-4 py-2 border-b border-border bg-white shrink-0 overflow-x-auto">
                  {imageArtifacts.map((a, i) => (
                    <img
                      key={i}
                      src={a.content}
                      alt={a.name}
                      className="h-14 w-14 rounded-lg object-cover border-2 border-border hover:border-primary cursor-pointer shrink-0 transition-colors"
                      onClick={() => {
                        // Scroll to this image — just show it in the main area
                        // by making it the "latest" via a local state
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-auto">
                <ArtifactPreview artifact={previewArtifact!} />
              </div>
              {/* All files strip */}
              {allArtifacts.length > 1 && (
                <div className="border-t border-border bg-white px-4 py-2 shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {allArtifacts.map((artifact, i) => (
                      <button key={i}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-border text-xs text-gray-600 hover:bg-gray-100 transition-all"
                        onClick={() => {
                          const blob = new Blob([artifact.content], { type: artifact.type });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = artifact.name; a.click();
                          URL.revokeObjectURL(url);
                        }}>
                        {artifact.type.startsWith("image/") ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {artifact.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Live Browser Tab ── */}
        <TabsContent value="browser" className="flex-1 overflow-hidden m-0">
          {!hasBrowser ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
                <MonitorPlay className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No browser session</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Ask the agent to browse a website to see it live here</p>
            </div>
          ) : (
            <div className="h-full p-3">
              <LiveBrowserPanel
                sessionId={activeBrowserSession!.sessionId}
                liveViewUrl={activeBrowserSession!.liveViewUrl}
                onClose={() => {
                  onCloseBrowser();
                  setActiveTab("log");
                }}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentWorkspace() {
  const { agentId } = useParams<{ agentId: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [input, setInput] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("task") ?? "";
    } catch { return ""; }
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveSteps, setLiveSteps] = useState<AgentStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // Mobile: which tab is active
  const [mobileTab, setMobileTab] = useState<"chat" | "log">("chat");
  // Track if any previewable artifact has been generated (for mobile badge)
  const hasAnyArtifact = liveSteps.some(s => (s.artifacts ?? []).length > 0);
  // Live browser session state
  const [activeBrowserSession, setActiveBrowserSession] = useState<{
    sessionId: string;
    liveViewUrl: string;
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: agentList } = trpc.agents.list.useQuery();
  const agent = agentList?.find(a => a.id === parseInt(agentId ?? "0"));
  const { data: creditBalance, refetch: refetchCredits } = trpc.credits.balance.useQuery(undefined, { refetchInterval: 30000 });

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRunning]);

  // Auto-scroll steps to bottom
  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveSteps.length]);

  // Switch to log tab automatically when agent starts running on mobile
  useEffect(() => {
    if (isRunning) setMobileTab("log");
  }, [isRunning]);

  // Switch to log/preview tab when task completes (to show results)
  useEffect(() => {
    if (runStatus === "complete") {
      // Stay on log tab so user sees the result; Preview tab auto-switches internally
    }
  }, [runStatus]);

  // Elapsed timer
  useEffect(() => {
    if (isRunning && runStartedAt) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - runStartedAt) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, runStartedAt]);

  // Handle browser session from SSE events
  const handleShowBrowser = useCallback((sessionId: string, liveViewUrl: string) => {
    setActiveBrowserSession({ sessionId, liveViewUrl });
    // On mobile, switch to the log tab to show the browser
    setMobileTab("log");
  }, []);

  const handleCloseBrowser = useCallback(() => {
    setActiveBrowserSession(null);
  }, []);

  const runTask = useCallback(async () => {
    if (!input.trim() || isRunning || !agentId) return;

    const userMessage = input.trim();
    setInput("");
    setIsRunning(true);
    setRunStatus("running");
    setLiveSteps([]);
    setCreditsUsed(0);
    setRunStartedAt(Date.now());
    setElapsed(0);
    // Clear browser session when starting a new task
    setActiveBrowserSession(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agentId: parseInt(agentId),
          message: userMessage,
          conversationHistory: history,
        }),
      });

      if (!response.ok) {
        const err = await response.json() as { error?: string };
        throw new Error(err.error ?? "Failed to start agent");
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalAnswer = "";
      let taskCredits = 0;

      const processBuffer = (buf: string) => {
        const parts = buf.split(/\n\n/);
        const remaining = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.trim()) continue;
          let eventType = "";
          let dataLine = "";
          for (const line of part.split("\n")) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataLine = line.slice(6).trim();
          }
          if (!eventType || !dataLine) continue;
          try {
            const data = JSON.parse(dataLine) as Record<string, unknown>;
            if (eventType === "step") {
              const step = data as unknown as AgentStep;
              setLiveSteps(prev => [...prev, step]);
              // Auto-show live browser when a browse_web tool call includes a session
              if (
                step.toolName === "browse_web" &&
                step.browserSessionId &&
                step.browserLiveViewUrl
              ) {
                setActiveBrowserSession({
                  sessionId: step.browserSessionId,
                  liveViewUrl: step.browserLiveViewUrl,
                });
                setMobileTab("log");
              }
            } else if (eventType === "complete") {
              finalAnswer = (data.finalAnswer as string) ?? "";
              taskCredits = (data.creditsUsed as number) ?? 0;
              setCreditsUsed(taskCredits);
              setRunStatus("complete");
              setIsRunning(false);
            } else if (eventType === "error") {
              setRunStatus("error");
              toast.error((data.error as string) ?? "Agent encountered an error");
              setIsRunning(false);
            }
          } catch { /* ignore */ }
        }
        return remaining;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) processBuffer(buffer + "\n\n");
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        buffer = processBuffer(buffer);
      }

      if (!finalAnswer) {
        const completeStep = [...liveSteps].reverse().find(s => s.type === "complete");
        finalAnswer = completeStep?.content ?? "";
      }

      if (finalAnswer) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: finalAnswer,
          timestamp: Date.now(),
          creditsUsed: taskCredits,
          status: "complete",
        };
        setMessages(prev => [...prev, assistantMsg]);
      }

      setIsRunning(false);
      setRunStatus("complete");
      void refetchCredits();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg);
      setRunStatus("error");
      setIsRunning(false);
    }
  }, [input, isRunning, agentId, messages, liveSteps, refetchCredits]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please log in to use agents</p>
        </div>
      </div>
    );
  }

  const allArtifacts = liveSteps.flatMap(s => s.artifacts ?? []);

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">

      {/* ── Top Header ── */}
      <header className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-border bg-white shrink-0 shadow-sm">
        <Button
          variant="ghost" size="icon"
          className="text-muted-foreground hover:text-foreground h-9 w-9 shrink-0"
          onClick={() => navigate("/dashboard/agents")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">{agent?.name ?? "AI Agent"}</h1>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block">Powered by Future AI</p>
          </div>
        </div>

        {/* Run stats — hidden on very small screens */}
        {isRunning && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Working...
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {elapsed}s
            </span>
          </div>
        )}
        {isRunning && (
          <span className="flex sm:hidden items-center gap-1 text-xs text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {elapsed}s
          </span>
        )}

        {/* Live browser indicator in header */}
        {activeBrowserSession && (
          <button
            onClick={() => handleShowBrowser(activeBrowserSession.sessionId, activeBrowserSession.liveViewUrl)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-700 text-xs font-medium hover:bg-indigo-200 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <MonitorPlay className="w-3 h-3" />
            Live Browser
          </button>
        )}

        {/* Credit balance */}
        {creditBalance !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${
            creditBalance <= 10
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-primary/20 bg-primary/5 text-primary"
          }`}>
            <Coins className="w-3 h-3" />
            <span className="hidden xs:inline">{creditBalance}</span>
            <span className="xs:hidden">{creditBalance > 999 ? `${Math.floor(creditBalance/1000)}k` : creditBalance}</span>
          </div>
        )}

        <Button
          variant="outline" size="sm"
          className="text-xs h-8 gap-1 border-border hidden sm:flex"
          onClick={() => {
            setMessages([]);
            setLiveSteps([]);
            setRunStatus("idle");
            setCreditsUsed(0);
            setActiveBrowserSession(null);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </Button>
      </header>

      {/* ── Mobile Tab Bar ── */}
      <div className="md:hidden flex border-b border-border bg-white shrink-0">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            mobileTab === "chat"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setMobileTab("chat")}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors relative ${
            mobileTab === "log"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setMobileTab("log")}
        >
          {activeBrowserSession ? (
            <MonitorPlay className="w-4 h-4" />
          ) : (
            <Activity className="w-4 h-4" />
          )}
          {activeBrowserSession ? "Live Browser" : "Live Log"}
          {(isRunning || activeBrowserSession) && (
            <span className="absolute top-2 right-6 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          )}
          {liveSteps.length > 0 && !isRunning && !activeBrowserSession && (
            <span className="ml-1 text-xs text-muted-foreground">({liveSteps.length})</span>
          )}
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ══════════════════════════════════════════
            LEFT / MOBILE CHAT: Conversation Panel
        ══════════════════════════════════════════ */}
        <div className={`
          flex flex-col bg-white
          w-full md:w-[400px] xl:w-[440px] md:shrink-0 md:border-r md:border-border
          ${mobileTab === "chat" ? "flex" : "hidden md:flex"}
        `}>
          <ChatPanelContent
            messages={messages}
            isRunning={isRunning}
            agent={agent}
            input={input}
            setInput={setInput}
            runTask={() => void runTask()}
            inputRef={inputRef}
            chatEndRef={chatEndRef}
          />
        </div>

        {/* ══════════════════════════════════════════
            RIGHT / MOBILE LOG: Execution Log Panel
        ══════════════════════════════════════════ */}
        <div className={`
          flex-1 flex flex-col overflow-hidden bg-gray-50/50
          ${mobileTab === "log" ? "flex" : "hidden md:flex"}
        `}>
          <LogPanelContent
            liveSteps={liveSteps}
            isRunning={isRunning}
            runStatus={runStatus}
            allArtifacts={allArtifacts}
            stepsEndRef={stepsEndRef}
            activeBrowserSession={activeBrowserSession}
            onShowBrowser={handleShowBrowser}
            onCloseBrowser={handleCloseBrowser}
          />
        </div>
      </div>
    </div>
  );
}
