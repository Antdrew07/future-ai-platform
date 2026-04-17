/**
 * Future AI Platform — Agent Workspace
 *
 * Manus-style split-pane layout:
 * - LEFT:  Persistent back-and-forth conversation (chat bubbles + input)
 * - RIGHT: Live execution log (step cards, tool calls, results)
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
  AlertCircle, Cpu, Clock, Coins, Plus
} from "lucide-react";

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
  artifacts?: { name: string; content: string; type: string }[];
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

function StepCard({ step, isLast }: { step: AgentStep; isLast?: boolean }) {
  const [expanded, setExpanded] = useState(
    step.type === "complete" || step.type === "error" || (isLast === true && step.type !== "thinking")
  );
  const colors = getStepColors(step);

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
                    const blob = new Blob([artifact.content], { type: artifact.type });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = artifact.name; a.click();
                    URL.revokeObjectURL(url);
                  }}>
                  <Download className="w-3 h-3" />{artifact.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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

  // Full conversation: each entry is a user or assistant message
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Current live steps for the in-progress run
  const [liveSteps, setLiveSteps] = useState<AgentStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

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

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Build conversation history for context
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

      // Fallback: extract final answer from steps if not in complete event
      if (!finalAnswer) {
        const completeStep = [...liveSteps].reverse().find(s => s.type === "complete");
        finalAnswer = completeStep?.content ?? "";
      }

      // Add assistant reply to chat
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void runTask();
    }
  };

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
    <div className="h-screen flex flex-col bg-background overflow-hidden">

      {/* ── Top Header ── */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-white shrink-0 shadow-sm">
        <Button
          variant="ghost" size="icon"
          className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
          onClick={() => navigate("/dashboard/agents")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">{agent?.name ?? "AI Agent"}</h1>
            <p className="text-[11px] text-muted-foreground truncate">Powered by Future AI</p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Run stats */}
        {isRunning && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
        {!isRunning && creditsUsed > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Coins className="w-3 h-3" />
            {creditsUsed} credits used
          </span>
        )}

        {/* Credit balance */}
        {creditBalance !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
            creditBalance <= 10
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-primary/20 bg-primary/5 text-primary"
          }`}>
            <Coins className="w-3 h-3" />
            {creditBalance} credits
          </div>
        )}

        <Button
          variant="outline" size="sm"
          className="text-xs h-8 gap-1.5 border-border"
          onClick={() => {
            setMessages([]);
            setLiveSteps([]);
            setRunStatus("idle");
            setCreditsUsed(0);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </Button>
      </header>

      {/* ── Main Split Pane ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══════════════════════════════════════════
            LEFT: Conversation Panel
        ══════════════════════════════════════════ */}
        <div className="w-[400px] xl:w-[440px] shrink-0 flex flex-col border-r border-border bg-white">

          {/* Chat messages */}
          <ScrollArea className="flex-1 px-4 py-4">
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
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                      <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.role === "assistant" && msg.creditsUsed && msg.creditsUsed > 0 ? (
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Coins className="w-2.5 h-2.5" />
                        {msg.creditsUsed} credits · {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}

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
          </ScrollArea>

          {/* ── Input Box ── */}
          <div className="p-3 border-t border-border bg-white">
            <div className="flex items-end gap-2 bg-gray-50 border border-border rounded-2xl px-4 py-3 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRunning ? "Agent is working..." : "Message your agent... (Enter to send)"}
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
                className="h-8 w-8 bg-primary hover:bg-primary/90 rounded-xl shrink-0"
                onClick={() => void runTask()}
                disabled={!input.trim() || isRunning}
              >
                {isRunning
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT: Execution Log Panel
        ══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">

          {/* Log header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Execution Log</span>
              {runStatus !== "idle" && (
                <Badge variant="outline" className={`text-xs ml-1 ${
                  runStatus === "running" ? "border-emerald-300 text-emerald-600 bg-emerald-50" :
                  runStatus === "complete" ? "border-emerald-300 text-emerald-600 bg-emerald-50" :
                  runStatus === "error" ? "border-red-300 text-red-600 bg-red-50" : ""
                }`}>
                  {runStatus === "running" ? "Running" : runStatus === "complete" ? "Complete" : "Error"}
                </Badge>
              )}
            </div>
            {liveSteps.length > 0 && (
              <span className="text-xs text-muted-foreground">{liveSteps.length} steps</span>
            )}
          </div>

          {/* Steps */}
          <ScrollArea className="flex-1 p-4">
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
                  <StepCard key={step.id} step={step} isLast={idx === liveSteps.length - 1} />
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
          </ScrollArea>

          {/* Artifacts panel */}
          {allArtifacts.length > 0 && (
            <div className="border-t border-border bg-white px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-foreground">Output Files ({allArtifacts.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allArtifacts.map((artifact, i) => (
                  <button key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-100 transition-all"
                    onClick={() => {
                      const blob = new Blob([artifact.content], { type: artifact.type });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = artifact.name; a.click();
                      URL.revokeObjectURL(url);
                    }}>
                    <FileText className="w-3 h-3" />{artifact.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
