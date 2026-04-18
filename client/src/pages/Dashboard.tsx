/**
 * Future AI Platform — Dashboard (Home Chat)
 *
 * Single-screen chat experience — like Claude / Manus / Twin.
 * No redirects, no re-typing. The prompt box IS the conversation.
 *
 * Layout:
 *  - Desktop: LEFT sidebar (FutureDashboardLayout) + RIGHT = full-height chat
 *  - When a task is running: chat panel splits into chat (left) + execution log (right)
 *  - Mobile: full-screen chat with bottom input, tab bar for log
 */

import { useState, useRef, useEffect, useCallback } from "react";
import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  ArrowUp, Globe, Code2, Smartphone, Briefcase, ShoppingBag,
  TrendingUp, FileText, Megaphone, Rocket, Zap, Bot, Loader2,
  Sparkles, Terminal, Search, CheckCircle2, XCircle, ChevronDown,
  ChevronRight, Download, Eye, ExternalLink, Monitor, Copy,
  Database, Image, AlertCircle, Cpu, Clock, Coins, Activity,
  MessageSquare, Plus, ShoppingCart, MonitorPlay, X, Maximize2,
  Minimize2, RefreshCw, Square
} from "lucide-react";
import { useLocation as useWouterLocation } from "wouter";

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: Globe,       label: "Build a website",         prompt: "Build a professional website for my business." },
  { icon: Smartphone,  label: "Build an iPhone app",     prompt: "Help me build an iPhone app from scratch." },
  { icon: Smartphone,  label: "Build an Android app",   prompt: "Help me build an Android app from scratch." },
  { icon: Briefcase,   label: "Launch a business",       prompt: "Help me launch a business — plan, brand, website, and first steps." },
  { icon: ShoppingBag, label: "Start an online store",   prompt: "Help me start an online store with products, payments, and design." },
  { icon: FileText,    label: "Write a book",            prompt: "Help me write a book — I'll describe the idea and you'll write it." },
  { icon: Megaphone,   label: "Create a marketing plan", prompt: "Create a marketing plan for my business." },
  { icon: TrendingUp,  label: "Write a business plan",   prompt: "Write a complete business plan including market research and financials." },
  { icon: Rocket,      label: "Grow my social media",    prompt: "Help me grow my social media with a content strategy and posts." },
  { icon: Code2,       label: "Write & run code",        prompt: "Write and run code to solve a problem for me." },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentStep {
  id: string;
  type: "thinking" | "tool_call" | "tool_result" | "message" | "error" | "complete";
  title: string;
  content: string;
  toolName?: string;
  isError?: boolean;
  timestamp: number;
  artifacts?: { name: string; content: string; type: string; url?: string }[];
  browserSessionId?: string;
  browserLiveViewUrl?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  creditsUsed?: number;
  timestamp: number;
  status?: "running" | "complete" | "error";
}

// ─── Domain Upsell ────────────────────────────────────────────────────────────

function DomainUpsell({ prompt: _prompt }: { prompt: string }) {
  const [, navigate] = useWouterLocation();
  const [dismissed, setDismissed] = useState(false);
  // Use a fixed generic search — never derive domain names from the user's chat query
  const searchQuery = "myapp";
  const { data } = trpc.domains.search.useQuery({ query: searchQuery }, { enabled: !!searchQuery });
  const available = data?.results.filter(r => r.available).slice(0, 3) ?? [];
  if (dismissed || available.length === 0) return null;
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
              <button onClick={() => navigate(`/dashboard/domains?search=${encodeURIComponent(searchQuery)}`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                <ShoppingCart className="w-3 h-3" /> Get it
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

// ─── HTML extraction + preview ────────────────────────────────────────────────

function extractHtml(content: string): string | null {
  const t = content.trim();
  if (/^<!doctype\s+html/i.test(t) || /^<html/i.test(t)) return t;
  const fenced = t.match(/```html\s*\n([\s\S]*?)\n?```/i);
  if (fenced) return fenced[1].trim();
  if (t.length > 300 && /<html[\s>]/i.test(t) && /<\/html>/i.test(t)) {
    const s = t.search(/<html[\s>]/i);
    const e = t.lastIndexOf("</html>") + 7;
    return t.slice(s, e);
  }
  return null;
}

type Artifact = { name: string; content: string; type: string; url?: string };

/**
 * Inline all linked CSS and JS files from the artifact store into the HTML
 * so the iframe preview is fully self-contained (no relative-path fetches).
 */
function inlineHtml(html: string, artifacts: Artifact[]): string {
  let result = html;
  // Inline <link rel="stylesheet" href="..."> → <style>...</style>
  result = result.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*\/?>/gi,
    (_match, href) => {
      const filename = href.split("/").pop() ?? href;
      const css = artifacts.find(a => a.name === filename || a.name.endsWith(`/${filename}`));
      return css ? `<style>/* ${filename} */\n${css.content}\n</style>` : _match;
    }
  );
  // Also handle href before rel
  result = result.replace(
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["'][^>]*\/?>/gi,
    (_match, href) => {
      const filename = href.split("/").pop() ?? href;
      const css = artifacts.find(a => a.name === filename || a.name.endsWith(`/${filename}`));
      return css ? `<style>/* ${filename} */\n${css.content}\n</style>` : _match;
    }
  );
  // Inline <script src="..."> → <script>...</script>
  result = result.replace(
    /<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi,
    (_match, src) => {
      const filename = src.split("/").pop() ?? src;
      const js = artifacts.find(a => a.name === filename || a.name.endsWith(`/${filename}`));
      return js ? `<script>/* ${filename} */\n${js.content}\n</script>` : _match;
    }
  );
  return result;
}

function HtmlPreview({ html, artifacts = [] }: { html: string; artifacts?: Artifact[] }) {
  const inlined = artifacts.length > 0 ? inlineHtml(html, artifacts) : html;
  const [view, setView] = useState<"preview" | "code">("preview");
  const openTab = () => {
    const blob = new Blob([inlined], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm mt-2">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold">Website Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView("preview")} className={`px-2.5 py-1 text-xs font-medium transition-colors ${view === "preview" ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-gray-50"}`}>
              <Eye className="w-3 h-3 inline mr-1" />Preview
            </button>
            <button onClick={() => setView("code")} className={`px-2.5 py-1 text-xs font-medium border-l border-border transition-colors ${view === "code" ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-gray-50"}`}>
              <Code2 className="w-3 h-3 inline mr-1" />Code
            </button>
          </div>
          <button onClick={openTab} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted-foreground transition-colors"><ExternalLink className="w-3.5 h-3.5" /></button>
          <button onClick={() => { navigator.clipboard.writeText(html); toast.success("Copied!"); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted-foreground transition-colors"><Copy className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {view === "preview" ? (
        <div style={{ height: 380 }}><iframe srcDoc={inlined} sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0" title="Preview" /></div>
      ) : (
        <pre className="text-xs text-green-300 bg-gray-950 p-4 overflow-auto max-h-[380px] font-mono whitespace-pre-wrap">{html}</pre>
      )}
      <div className="px-3 py-2 bg-gray-50 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Click Open to view full screen</span>
        <button onClick={openTab} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"><ExternalLink className="w-3 h-3" />Open full screen</button>
      </div>
    </div>
  );
}

function AssistantContent({ content }: { content: string }) {
  const html = extractHtml(content);
  if (html) {
    const pre = content.indexOf(html.slice(0, 40)) > 0 ? content.slice(0, content.indexOf(html.slice(0, 40))).trim() : "";
    return (
      <div className="space-y-2">
        {pre && <div className="prose prose-sm max-w-none text-sm"><Streamdown>{pre}</Streamdown></div>}
        <HtmlPreview html={html} />
      </div>
    );
  }
  return <div className="prose prose-sm max-w-none text-sm"><Streamdown>{content}</Streamdown></div>;
}

// ─── Execution step helpers ───────────────────────────────────────────────────

function getStepIcon(step: AgentStep, isActive = false) {
  if (step.isError) return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  switch (step.type) {
    case "thinking": return <Cpu className={`w-3.5 h-3.5 text-indigo-500${isActive ? " animate-pulse" : ""}`} />;
    case "tool_call":
      if (step.toolName === "web_search") return <Search className="w-3.5 h-3.5 text-blue-500" />;
      if (step.toolName === "code_execute") return <Code2 className="w-3.5 h-3.5 text-emerald-500" />;
      if (step.toolName === "browse_url" || step.toolName === "browse_web") return <MonitorPlay className="w-3.5 h-3.5 text-indigo-500" />;
      if (step.toolName === "scrape_web") return <Database className="w-3.5 h-3.5 text-cyan-500" />;
      if (step.toolName === "shell_execute") return <Terminal className="w-3.5 h-3.5 text-orange-500" />;
      if (step.toolName === "export_document") return <FileText className="w-3.5 h-3.5 text-amber-500" />;
      if (step.toolName === "create_spreadsheet") return <Database className="w-3.5 h-3.5 text-green-500" />;
      return <Zap className="w-3.5 h-3.5 text-orange-500" />;
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
    case "tool_result": return step.isError ? { border: "border-red-200", bg: "bg-red-50" } : { border: "border-emerald-200", bg: "bg-emerald-50/60" };
    case "complete": return { border: "border-amber-200", bg: "bg-amber-50/60" };
    case "error": return { border: "border-red-200", bg: "bg-red-50" };
    default: return { border: "border-border", bg: "bg-white" };
  }
}

function StepCard({ step, isLast, isRunning, onShowBrowser }: { step: AgentStep; isLast?: boolean; isRunning?: boolean; onShowBrowser?: (id: string, url: string) => void }) {
  const [expanded, setExpanded] = useState(step.type === "complete" || step.type === "error" || (isLast === true && step.type !== "thinking"));
  const colors = getStepColors(step);
  const isActive = !!(isLast && isRunning);
  useEffect(() => { if (step.type === "complete" || step.type === "error") setExpanded(true); }, [step.type]);
  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all`}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="shrink-0 w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-border shadow-sm">{getStepIcon(step, isActive)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{step.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{new Date(step.timestamp).toLocaleTimeString()}</p>
        </div>
        {step.browserSessionId && step.browserLiveViewUrl && (
          <button onClick={e => { e.stopPropagation(); onShowBrowser?.(step.browserSessionId!, step.browserLiveViewUrl!); }}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-700 text-[10px] font-medium hover:bg-indigo-200 transition-colors shrink-0">
            <MonitorPlay className="w-3 h-3" />Watch Live
          </button>
        )}
        {step.type === "thinking" && isActive ? (
          <div className="flex gap-1 items-center px-2 py-1 rounded-full bg-indigo-100 border border-indigo-200">
            {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
          </div>
        ) : (
          expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {expanded && step.content && (
        <div className="px-4 pb-4 border-t border-black/5">
          <div className="mt-3 text-sm text-gray-700 prose prose-sm max-w-none"><Streamdown>{step.content}</Streamdown></div>
          {step.artifacts && step.artifacts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {step.artifacts.map((a, i) => (
                <button key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-100 transition-all"
                  onClick={() => {
                    if (a.url) {
                      const el = document.createElement("a"); el.href = a.url; el.download = a.name; el.target = "_blank"; el.click(); return;
                    }
                    const blob = new Blob([a.content], { type: a.type });
                    const url = URL.createObjectURL(blob);
                    if (a.name.endsWith(".html")) { window.open(url, "_blank"); setTimeout(() => URL.revokeObjectURL(url), 5000); }
                    else { const el = document.createElement("a"); el.href = url; el.download = a.name; el.click(); URL.revokeObjectURL(url); }
                  }}>
                  {a.name.endsWith(".html") ? <Eye className="w-3 h-3" /> : <Download className="w-3 h-3" />}{a.name}
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

function LiveBrowserPanel({ sessionId, liveViewUrl, onClose }: { sessionId: string; liveViewUrl: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [key, setKey] = useState(0);
  const { data } = trpc.browser.getSession.useQuery({ sessionId }, { refetchInterval: 10000, retry: false });
  const active = !data || data.status === "active" || data.status === "running";
  return (
    <div className={`rounded-xl border border-indigo-200 overflow-hidden shadow-sm ${expanded ? "fixed inset-4 z-50 shadow-2xl" : ""}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 border-b border-indigo-200">
        <div className="flex items-center gap-2">
          <MonitorPlay className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-800">Live Browser</span>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${active ? "bg-emerald-100 border border-emerald-300 text-emerald-700" : "bg-gray-100 border border-gray-300 text-gray-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            {active ? "Live" : "Ended"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setKey(k => k + 1)} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
          <a href={liveViewUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 transition-colors">{expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}</button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-100 text-indigo-500 hover:text-red-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className={`bg-white ${expanded ? "h-[calc(100%-44px)]" : "h-[320px]"}`}>
        {active ? <iframe key={key} src={liveViewUrl} className="w-full h-full border-0" title="Live browser" allow="clipboard-read; clipboard-write" /> : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MonitorPlay className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Browser session ended</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveSteps, setLiveSteps] = useState<AgentStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "log">("chat");
  const [activeBrowser, setActiveBrowser] = useState<{ sessionId: string; liveViewUrl: string } | null>(null);
  // Whether the user has sent at least one message (switches from "home" to "chat" mode)
  const [chatStarted, setChatStarted] = useState(false);
  // Instant reply: streamed fast acknowledgment before agent steps begin
  const [instantReplyText, setInstantReplyText] = useState("");
  const [instantReplyDone, setInstantReplyDone] = useState(false);

  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelTask = trpc.tasks.cancel.useMutation({
    onSuccess: () => {
      setIsRunning(false);
      setRunStatus("error");
      toast.info("Task stopped.");
      void refetchBalance();
    },
    onError: () => {
      // Even if cancel fails on server, stop the UI
      setIsRunning(false);
      setRunStatus("error");
    },
  });

  const stopTask = useCallback(() => {
    // Abort the SSE fetch stream immediately
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    // Cancel the task in DB
    if (currentTaskId) {
      cancelTask.mutate({ id: currentTaskId });
    } else {
      setIsRunning(false);
      setRunStatus("error");
    }
  }, [currentTaskId, cancelTask]);

  const { data: agents } = trpc.agents.list.useQuery();
  const { data: balance, refetch: refetchBalance } = trpc.credits.balance.useQuery(undefined, { refetchInterval: 30000 });
  const { data: recentTasks } = trpc.tasks.list.useQuery({ limit: 5, offset: 0 }, { enabled: !chatStarted });

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  // Auto-scroll
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isRunning]);
  useEffect(() => { stepsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [liveSteps.length]);

  // Switch mobile tab when running
  useEffect(() => { if (isRunning) setMobileTab("log"); }, [isRunning]);
  useEffect(() => { if (runStatus === "complete") setMobileTab("chat"); }, [runStatus]);

  // Elapsed timer
  useEffect(() => {
    if (isRunning && runStartedAt) {
      timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - runStartedAt) / 1000)), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, runStartedAt]);

  const getAgentId = useCallback((): number => {
    if (agents && agents.length > 0) return agents[0].id;
    return 1;
  }, [agents]);

  const runTask = useCallback(async (taskOverride?: string) => {
    const task = (taskOverride ?? input).trim();
    if (!task || isRunning) return;

    setInput("");
    setIsRunning(true);
    setRunStatus("running");
    setLiveSteps([]);
    setRunStartedAt(Date.now());
    setElapsed(0);
    setActiveBrowser(null);
    setChatStarted(true);
    setInstantReplyText("");
    setInstantReplyDone(false);
    setCurrentTaskId(null);

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: "user",
      content: task,
      timestamp: Date.now(),
    }]);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const agentId = getAgentId();

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ agentId, message: task, conversationHistory: history }),
        signal: abortController.signal,
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
            if (eventType === "task_created") {
              const taskCreated = data as { taskId?: number };
              if (taskCreated.taskId) setCurrentTaskId(taskCreated.taskId);
            } else if (eventType === "instant_reply_token") {
              const token = (data as { token?: string }).token ?? "";
              if (token) setInstantReplyText(prev => prev + token);
            } else if (eventType === "instant_reply_done") {
              setInstantReplyDone(true);
            } else if (eventType === "step") {
              const step = data as unknown as AgentStep;
              setLiveSteps(prev => [...prev, step]);
              if (step.toolName === "browse_web" && step.browserSessionId && step.browserLiveViewUrl) {
                setActiveBrowser({ sessionId: step.browserSessionId, liveViewUrl: step.browserLiveViewUrl });
                setMobileTab("log");
              }
            } else if (eventType === "complete") {
              finalAnswer = (data.finalAnswer as string) ?? "";
              taskCredits = (data.creditsUsed as number) ?? 0;
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
        if (done) { if (buffer.trim()) processBuffer(buffer + "\n\n"); break; }
        buffer += decoder.decode(value, { stream: true });
        buffer = processBuffer(buffer);
      }

      if (!finalAnswer) {
        const completeStep = [...liveSteps].reverse().find(s => s.type === "complete");
        finalAnswer = completeStep?.content ?? "";
      }

      if (finalAnswer) {
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: finalAnswer,
          timestamp: Date.now(),
          creditsUsed: taskCredits,
          status: "complete",
        }]);
      }

      setIsRunning(false);
      setRunStatus("complete");
      void refetchBalance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
      setRunStatus("error");
      setIsRunning(false);
    }
  }, [input, isRunning, messages, getAgentId, liveSteps, refetchBalance]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void runTask(); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const allArtifacts = liveSteps.flatMap(s => s.artifacts ?? []);

  // ── Input Box — rendered as JSX directly (NOT a nested component) to preserve focus ──
  const inputBoxJSX = (
    <div className="shrink-0 px-4 pb-4 pt-2 border-t border-border bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-gray-50 border border-border rounded-2xl px-4 py-3 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRunning ? "Agent is working..." : "Tell me what you want — I'll handle everything for you..."}
            rows={1}
            disabled={isRunning}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 resize-none outline-none min-h-[24px] max-h-[120px] leading-relaxed disabled:opacity-50"
            style={{ height: "auto" }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => void runTask()}
            disabled={!input.trim() || isRunning}
            className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-primary/20 shrink-0"
          >
            {isRunning ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <ArrowUp className="w-4 h-4 text-white" />}
          </button>
        </div>
        {!chatStarted && (
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
              <button key={label} onClick={() => void runTask(prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-accent border border-border hover:border-primary/30 transition-all">
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground text-center mt-2 hidden sm:block">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );

  // ── HOME MODE: no messages yet ──────────────────────────────────────────────
  if (!chatStarted) {
    return (
      <FutureDashboardLayout showNewAgent={false}>
        <div className="flex flex-col h-full">
          {/* Hero */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-2 max-w-3xl mx-auto w-full">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-1 text-center">
              {greeting()}, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              I'm ready when you are. What shall we work on today?
            </p>

            {/* Recent tasks */}
            {recentTasks && recentTasks.length > 0 && (
              <div className="w-full mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Recent</span>
                  <Link href="/dashboard/agents" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">View all →</Link>
                </div>
                <div className="space-y-1.5">
                  {recentTasks.slice(0, 3).map(task => (
                    <button key={task.id} onClick={() => void runTask(task.title)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent border border-transparent hover:border-border transition-all text-left group">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-foreground/70 group-hover:text-foreground truncate flex-1 transition-colors">{task.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Credits */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mb-4">
              <Zap className="w-3 h-3 text-primary/50" />
              <span>{balance?.toLocaleString() ?? "—"} credits available</span>
              <span className="mx-1">·</span>
              <Link href="/dashboard/billing" className="text-primary/70 hover:text-primary transition-colors">Top up</Link>
            </div>
          </div>

          {/* Input always at bottom */}
          {inputBoxJSX}
        </div>
      </FutureDashboardLayout>
    );
  }

  // ── CHAT MODE: conversation in progress ─────────────────────────────────────
  return (
    <FutureDashboardLayout showNewAgent={false}>
      <div className="flex flex-col h-full overflow-hidden">

        {/* Mobile tab bar */}
        <div className="md:hidden flex border-b border-border bg-white shrink-0">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${mobileTab === "chat" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
            onClick={() => setMobileTab("chat")}>
            <MessageSquare className="w-4 h-4" />Chat
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors relative ${mobileTab === "log" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
            onClick={() => setMobileTab("log")}>
            {activeBrowser ? <MonitorPlay className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            {activeBrowser ? "Live Browser" : "Live Log"}
            {(isRunning || activeBrowser) && <span className="absolute top-2 right-6 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
          </button>
        </div>

        {/* Main split */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ── LEFT: Chat ── */}
          <div className={`flex flex-col bg-white w-full md:w-[480px] xl:w-[520px] md:shrink-0 md:border-r md:border-border ${mobileTab === "chat" ? "flex" : "hidden md:flex"}`}>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">Future AI</span>
                {isRunning && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Working · {elapsed}s
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {balance !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${balance <= 10 ? "border-red-200 bg-red-50 text-red-600" : "border-primary/20 bg-primary/5 text-primary"}`}>
                    <Coins className="w-3 h-3" />{balance.toLocaleString()}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => { setMessages([]); setLiveSteps([]); setRunStatus("idle"); setActiveBrowser(null); setChatStarted(false); }}>
                  <Plus className="w-3 h-3" />New
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {messages.map((msg, idx) => {
                const prevUser = messages.slice(0, idx).reverse().find(m => m.role === "user");
                const isWebBuild = msg.role === "assistant" && msg.status === "complete" && prevUser && /build|create|make|website|landing page|web app|homepage/i.test(prevUser.content);
                return (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3" : "bg-gray-50 border border-border rounded-2xl rounded-tl-sm px-4 py-3"}`}>
                      {msg.role === "assistant" ? <AssistantContent content={msg.content} /> : <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                      {msg.role === "assistant" && msg.creditsUsed && msg.creditsUsed > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                          <Coins className="w-2.5 h-2.5" />{msg.creditsUsed} credits · {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                      {isWebBuild && prevUser && <DomainUpsell prompt={prevUser.content} />}
                    </div>
                  </div>
                );
              })}
              {/* Instant reply: streamed fast acknowledgment */}
              {instantReplyText && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-blue-50/60 border border-blue-200/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{instantReplyText}
                      {!instantReplyDone && (
                        <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                      )}
                    </p>
                    {instantReplyDone && (
                      <p className="text-[10px] text-blue-500/70 mt-1.5 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        Working on it in the background...
                      </p>
                    )}
                  </div>
                </div>
              )}
              {/* Typing dots only when no instant reply yet */}
              {isRunning && !instantReplyText && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-gray-50 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      {[0, 150, 300].map(d => <span key={d} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            {inputBoxJSX}
          </div>

          {/* ── RIGHT: Execution Log + Live Browser ── */}
          <div className={`flex-1 flex flex-col overflow-hidden bg-gray-50/50 ${mobileTab === "log" ? "flex" : "hidden md:flex"}`}>
            {/* Log header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Execution Log</span>
                {runStatus !== "idle" && (
                  <Badge variant="outline" className={`text-xs ml-1 ${runStatus === "running" ? "border-emerald-300 text-emerald-600 bg-emerald-50" : runStatus === "complete" ? "border-emerald-300 text-emerald-600 bg-emerald-50" : "border-red-300 text-red-600 bg-red-50"}`}>
                    {runStatus === "running" ? "Running" : runStatus === "complete" ? "Complete" : "Error"}
                  </Badge>
                )}
                {activeBrowser && (
                  <button onClick={() => setActiveBrowser(activeBrowser)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-700 text-[10px] font-medium ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />Live Browser
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {liveSteps.length > 0 && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {isRunning ? `Step ${liveSteps.length}/30` : `${liveSteps.length} steps`}
                  </span>
                )}
                {isRunning && (
                  <button
                    onClick={stopTask}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium hover:bg-red-100 transition-all"
                    title="Stop this task"
                  >
                    <Square className="w-3 h-3 fill-red-600" />
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* Live browser */}
            {activeBrowser && (
              <div className="px-3 pt-3 shrink-0">
                <LiveBrowserPanel sessionId={activeBrowser.sessionId} liveViewUrl={activeBrowser.liveViewUrl} onClose={() => setActiveBrowser(null)} />
              </div>
            )}

            {/* Steps */}
            <div className="flex-1 overflow-y-auto p-4">
              {liveSteps.length === 0 && !isRunning ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
                    <Terminal className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Execution steps will appear here</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Send a message to see your agent work in real-time</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {liveSteps.map((step, idx) => (
                    <StepCard key={step.id} step={step} isLast={idx === liveSteps.length - 1} isRunning={isRunning}
                      onShowBrowser={(id, url) => setActiveBrowser({ sessionId: id, liveViewUrl: url })} />
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

            {/* Artifacts */}
            {allArtifacts.length > 0 && (
              <div className="border-t border-border bg-white px-4 py-3 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold">Output Files ({allArtifacts.length})</span>
                </div>
                {/* HTML artifacts: show inline preview with CSS/JS inlined */}
                {allArtifacts.filter(a => a.name.endsWith(".html") || a.name.endsWith(".htm")).map((a, i) => (
                  <div key={`html-${i}`} className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1 font-mono">{a.name}</p>
                    <HtmlPreview html={a.content} artifacts={allArtifacts} />
                  </div>
                ))}
                {/* Non-HTML artifacts: download buttons */}
                {allArtifacts.filter(a => !a.name.endsWith(".html") && !a.name.endsWith(".htm")).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {allArtifacts.filter(a => !a.name.endsWith(".html") && !a.name.endsWith(".htm")).map((a, i) => (
                      <button key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-100 transition-all"
                        onClick={() => {
                          if (a.url) { const el = document.createElement("a"); el.href = a.url; el.download = a.name; el.target = "_blank"; el.click(); return; }
                          const blob = new Blob([a.content], { type: a.type }); const url = URL.createObjectURL(blob); const el = document.createElement("a"); el.href = url; el.download = a.name; el.click(); URL.revokeObjectURL(url);
                        }}>
                        <FileText className="w-3 h-3" />{a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
