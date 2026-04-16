/**
 * Future AI Platform — Agent Workspace (Light Theme)
 *
 * Full-screen autonomous task execution interface:
 * - Left: Chat panel (task input + conversation history)
 * - Right: Live execution feed (steps, tool calls, results)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Bot, Send, Loader2, Search, Code2, FileText, Globe, Zap,
  CheckCircle2, XCircle, ChevronDown, ChevronRight, Copy,
  Download, ArrowLeft, Sparkles, Terminal, Image, Database,
  AlertCircle, Cpu, Clock, Coins
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

interface TaskRun {
  taskId: number;
  status: "idle" | "running" | "complete" | "error";
  steps: AgentStep[];
  finalAnswer: string;
  creditsUsed: number;
  startedAt?: number;
}

// ─── Tool Icons ───────────────────────────────────────────────────────────────

function getToolIcon(toolName?: string) {
  switch (toolName) {
    case "web_search": return <Search className="w-4 h-4 text-blue-500" />;
    case "code_execute": return <Code2 className="w-4 h-4 text-emerald-500" />;
    case "read_file":
    case "write_file": return <FileText className="w-4 h-4 text-amber-500" />;
    case "api_call": return <Globe className="w-4 h-4 text-violet-500" />;
    case "analyze_data": return <Database className="w-4 h-4 text-cyan-500" />;
    case "generate_image": return <Image className="w-4 h-4 text-pink-500" />;
    case "task_complete": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    default: return <Zap className="w-4 h-4 text-orange-500" />;
  }
}

function getStepIcon(step: AgentStep) {
  if (step.isError) return <XCircle className="w-4 h-4 text-red-500" />;
  switch (step.type) {
    case "thinking": return <Cpu className="w-4 h-4 text-indigo-500 animate-pulse" />;
    case "tool_call": return getToolIcon(step.toolName);
    case "tool_result": return step.isError ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case "complete": return <Sparkles className="w-4 h-4 text-amber-500" />;
    case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
    default: return <Bot className="w-4 h-4 text-blue-500" />;
  }
}

function getStepBorderColor(step: AgentStep): string {
  if (step.isError) return "border-red-200";
  switch (step.type) {
    case "thinking": return "border-indigo-200";
    case "tool_call": return "border-blue-200";
    case "tool_result": return step.isError ? "border-red-200" : "border-emerald-200";
    case "complete": return "border-amber-200";
    case "error": return "border-red-200";
    default: return "border-border";
  }
}

function getStepBg(step: AgentStep): string {
  if (step.isError) return "bg-red-50";
  switch (step.type) {
    case "thinking": return "bg-indigo-50/50";
    case "tool_call": return "bg-blue-50/50";
    case "tool_result": return step.isError ? "bg-red-50" : "bg-emerald-50/50";
    case "complete": return "bg-amber-50/50";
    case "error": return "bg-red-50";
    default: return "bg-white";
  }
}

// ─── Specialized Tool Result Renderers ───────────────────────────────────────

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
    return <div className="text-sm text-gray-600 font-mono whitespace-pre-wrap">{content.slice(0, 600)}</div>;
  }

  return (
    <div className="space-y-2">
      {results.slice(0, 5).map((r, i) => (
        <div key={i} className="rounded-md bg-blue-50 border border-blue-200 p-2.5">
          <p className="text-xs font-semibold text-blue-700 truncate">{r.title}</p>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{r.snippet}</p>
          {r.url && (
            <a href={r.url} target="_blank" rel="noreferrer"
              className="text-xs text-blue-500 hover:text-blue-700 truncate block mt-1">
              {r.url.slice(0, 60)}{r.url.length > 60 ? "..." : ""}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function CodeOutputRenderer({ content, toolName }: { content: string; toolName?: string }) {
  const isExec = toolName === "code_execute";
  const langMatch = content.match(/```(\w+)/);
  const lang = langMatch ? langMatch[1] : "";
  const codeContent = content.replace(/```\w*\n?/g, "").replace(/```/g, "").trim();

  return (
    <div className="rounded-md overflow-hidden border border-emerald-200">
      <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border-b border-emerald-200">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-emerald-600" />
          <span className="text-xs text-emerald-700">{isExec ? "Output" : lang || "Code"}</span>
        </div>
        <button
          className="text-xs text-gray-400 hover:text-gray-600"
          onClick={() => { navigator.clipboard.writeText(codeContent); }}
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
      <pre className="text-xs text-gray-700 bg-gray-50 p-3 overflow-x-auto max-h-48 font-mono whitespace-pre-wrap">
        {codeContent.slice(0, 2000)}{codeContent.length > 2000 ? "\n... (truncated)" : ""}
      </pre>
    </div>
  );
}

function FileTreeRenderer({ content }: { content: string }) {
  const lines = content.split("\n").filter(Boolean);
  return (
    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <FileText className="w-3 h-3 text-amber-600" />
        <span className="text-xs text-amber-700">File Contents</span>
      </div>
      <div className="space-y-0.5 max-h-40 overflow-y-auto">
        {lines.slice(0, 30).map((line, i) => (
          <div key={i} className="text-xs text-gray-600 font-mono">{line}</div>
        ))}
        {lines.length > 30 && <div className="text-xs text-gray-400">... {lines.length - 30} more lines</div>}
      </div>
    </div>
  );
}

function StepContentRenderer({ step }: { step: AgentStep }) {
  const { toolName, content, type } = step;

  if (toolName === "web_search" && type === "tool_result") {
    return <SearchResultRenderer content={content} />;
  }
  if ((toolName === "code_execute" || (content.includes("```") && type === "tool_call")) && content.trim()) {
    return <CodeOutputRenderer content={content} toolName={toolName} />;
  }
  if ((toolName === "read_file" || toolName === "write_file") && type === "tool_result") {
    return <FileTreeRenderer content={content} />;
  }
  if (toolName === "api_call" && type === "tool_result") {
    let pretty = content;
    try { pretty = JSON.stringify(JSON.parse(content), null, 2); } catch { /* not JSON */ }
    return (
      <pre className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-md p-3 overflow-x-auto max-h-48 font-mono whitespace-pre-wrap">
        {pretty.slice(0, 1500)}{pretty.length > 1500 ? "\n... (truncated)" : ""}
      </pre>
    );
  }

  return (
    <div className="text-sm text-gray-700 prose prose-sm max-w-none">
      <Streamdown>{content}</Streamdown>
    </div>
  );
}

// ─── Step Card Component ──────────────────────────────────────────────────────

function StepCard({ step, isLast }: { step: AgentStep; isLast?: boolean }) {
  const [expanded, setExpanded] = useState(
    step.type === "complete" || step.type === "error" || (isLast === true && step.type !== "thinking")
  );

  useEffect(() => {
    if (step.type === "complete" || step.type === "error") {
      setExpanded(true);
    }
  }, [step.type]);

  return (
    <div className={`rounded-xl border ${getStepBorderColor(step)} ${getStepBg(step)} overflow-hidden shadow-sm transition-all duration-300`}>
      <button
        className="w-full flex items-center gap-3 p-3.5 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-border shadow-sm">{getStepIcon(step)}</div>
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
          expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && step.content && (
        <div className="px-4 pb-4 border-t border-border/50">
          <div className="mt-3">
            <StepContentRenderer step={step} />
          </div>
          {step.artifacts && step.artifacts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {step.artifacts.map((artifact, i) => (
                <button
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-100 transition-all"
                  onClick={() => {
                    const blob = new Blob([artifact.content], { type: artifact.type });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = artifact.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-3 h-3" />
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

// ─── Artifacts Panel ──────────────────────────────────────────────────────────

function ArtifactsPanel({ steps }: { steps: AgentStep[] }) {
  const allArtifacts = steps.flatMap(s => s.artifacts ?? []);
  if (allArtifacts.length === 0) return null;

  return (
    <div className="border-t border-border bg-white px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center border border-emerald-200">
          <Download className="w-3 h-3 text-emerald-600" />
        </div>
        <span className="text-xs font-semibold text-foreground tracking-wide uppercase">Output Files ({allArtifacts.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {allArtifacts.map((artifact, i) => (
          <button
            key={i}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-100 transition-all font-medium"
            onClick={() => {
              const blob = new Blob([artifact.content], { type: artifact.type });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = artifact.name;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            {artifact.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Workspace Component ─────────────────────────────────────────────────

export default function AgentWorkspace() {
  const { agentId } = useParams<{ agentId: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [input, setInput] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("task") ?? "";
    } catch { return ""; }
  });
  const [currentRun, setCurrentRun] = useState<TaskRun | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string; taskId?: number }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const stepsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data: agentList } = trpc.agents.list.useQuery();
  const agent = agentList?.find(a => a.id === parseInt(agentId ?? "0"));
  const { data: creditData } = trpc.credits.balance.useQuery(undefined, { refetchInterval: 30000 });

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentRun?.steps.length]);

  useEffect(() => {
    return () => { eventSourceRef.current?.close(); };
  }, []);

  const runTask = useCallback(async () => {
    if (!input.trim() || isRunning || !agentId) return;

    const userMessage = input.trim();
    setInput("");
    setIsRunning(true);
    setConversationHistory(prev => [...prev, { role: "user", content: userMessage }]);

    const newRun: TaskRun = {
      taskId: 0,
      status: "running",
      steps: [],
      finalAnswer: "",
      creditsUsed: 0,
      startedAt: Date.now(),
    };
    setCurrentRun(newRun);

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agentId: parseInt(agentId),
          message: userMessage,
          conversationHistory: conversationHistory.map(m => ({ role: m.role, content: m.content })),
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

      const processSSEBuffer = (buf: string) => {
        const messages = buf.split(/\n\n/);
        const remaining = messages.pop() ?? "";

        for (const message of messages) {
          if (!message.trim()) continue;
          let eventType = "";
          let dataLine = "";

          for (const line of message.split("\n")) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataLine = line.slice(6).trim();
          }

          if (!eventType || !dataLine) continue;

          try {
            const data = JSON.parse(dataLine) as Record<string, unknown>;

            if (eventType === "task_created") {
              setCurrentRun(prev => prev ? { ...prev, taskId: data.taskId as number } : prev);
            } else if (eventType === "step") {
              const step = data as unknown as AgentStep;
              setCurrentRun(prev => prev ? { ...prev, steps: [...prev.steps, step] } : prev);
            } else if (eventType === "complete") {
              const finalAnswer = (data.finalAnswer as string) ?? "";
              setCurrentRun(prev => prev ? { ...prev, status: "complete", finalAnswer, creditsUsed: (data.creditsUsed as number) ?? 0 } : prev);
              if (finalAnswer) {
                setConversationHistory(prev => [...prev, { role: "assistant", content: finalAnswer }]);
              }
              setIsRunning(false);
            } else if (eventType === "error") {
              setCurrentRun(prev => prev ? { ...prev, status: "error" } : prev);
              toast.error((data.error as string) ?? "Agent encountered an error");
              setIsRunning(false);
            }
          } catch { /* ignore parse errors */ }
        }

        return remaining;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) processSSEBuffer(buffer + "\n\n");
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        buffer = processSSEBuffer(buffer);
      }

      setCurrentRun(prev => {
        if (!prev) return prev;
        if (prev.status === "complete") return prev;
        const completeStep = [...prev.steps].reverse().find(s => s.type === "complete");
        const finalAnswer = completeStep?.content ?? prev.finalAnswer ?? "";
        if (finalAnswer) {
          setConversationHistory(hist => {
            if (hist[hist.length - 1]?.role === "assistant") return hist;
            return [...hist, { role: "assistant", content: finalAnswer }];
          });
        }
        return { ...prev, status: "complete", finalAnswer };
      });
      setIsRunning(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg);
      setCurrentRun(prev => prev ? { ...prev, status: "error" } : prev);
      setIsRunning(false);
    }
  }, [input, isRunning, agentId, conversationHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runTask();
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

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-8 w-8"
          onClick={() => navigate("/dashboard/agents")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">{agent?.name ?? "Loading..."}</h1>
            <p className="text-xs text-muted-foreground">{agent?.modelId ?? "AI Agent"}</p>
          </div>
        </div>

        <div className="flex-1" />

        {currentRun && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {currentRun.status === "running" && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Running
              </span>
            )}
            {currentRun.creditsUsed > 0 && (
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {currentRun.creditsUsed} credits
              </span>
            )}
            {currentRun.startedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.round((Date.now() - currentRun.startedAt) / 1000)}s
              </span>
            )}
          </div>
        )}

        {creditData !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
            creditData <= 10
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-primary/20 bg-primary/5 text-primary"
          }`}>
            <Coins className="w-3 h-3" />
            <span>{creditData} credits</span>
          </div>
        )}
        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
          {agent?.webSearchEnabled && "Search "}
          {agent?.codeExecutionEnabled && "Code "}
          {agent?.apiCallsEnabled && "API"}
        </Badge>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: Chat Panel ── */}
        <div className="w-[420px] shrink-0 flex flex-col border-r border-border bg-white">
          <ScrollArea className="flex-1 p-4">
            {conversationHistory.length === 0 && !isRunning && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  {agent?.name ?? "AI Agent"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {agent?.description ?? "An autonomous AI agent that can search the web, write code, and complete complex tasks."}
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {[
                    "Search for the latest AI news",
                    "Write a Python script to analyze data",
                    "Create a detailed report on climate change",
                    "Build a simple REST API",
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-left"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {conversationHistory.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted border border-border text-foreground"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none text-foreground">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isRunning && conversationHistory[conversationHistory.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted border border-border rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-4 border-t border-border bg-white">
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Give your agent a task... (Enter to send, Shift+Enter for new line)"
                className="min-h-[80px] max-h-[200px] resize-none bg-background border-border text-foreground placeholder:text-muted-foreground text-sm pr-12 rounded-xl focus:border-primary/50"
                disabled={isRunning}
              />
              <Button
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8 bg-primary hover:bg-primary/90 rounded-lg"
                onClick={runTask}
                disabled={!input.trim() || isRunning}
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Agent can search the web, write code, call APIs, and more
            </p>
          </div>
        </div>

        {/* ── Right: Execution Feed ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Execution Log</span>
              {currentRun && (
                <Badge
                  variant="outline"
                  className={`text-xs ml-1 ${
                    currentRun.status === "running" ? "border-emerald-300 text-emerald-600 bg-emerald-50" :
                    currentRun.status === "complete" ? "border-emerald-300 text-emerald-600 bg-emerald-50" :
                    currentRun.status === "error" ? "border-red-300 text-red-600 bg-red-50" :
                    "border-border text-muted-foreground"
                  }`}
                >
                  {currentRun.status === "running" ? "Running" :
                   currentRun.status === "complete" ? "Complete" :
                   currentRun.status === "error" ? "Error" : "Idle"}
                </Badge>
              )}
            </div>
            {currentRun && currentRun.steps.length > 0 && (
              <span className="text-xs text-muted-foreground">{currentRun.steps.length} steps</span>
            )}
          </div>

          <ScrollArea className="flex-1 p-4" id="exec-scroll">
            {!currentRun && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
                  <Terminal className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Execution steps will appear here</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Send a task to see the agent work in real-time</p>
              </div>
            )}

            {currentRun && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <div className={`w-2 h-2 rounded-full ${
                    currentRun.status === "running" ? "bg-emerald-500 animate-pulse" :
                    currentRun.status === "complete" ? "bg-emerald-500" :
                    currentRun.status === "error" ? "bg-red-500" : "bg-muted-foreground"
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    Task #{currentRun.taskId} · {currentRun.steps.length} steps
                    {currentRun.creditsUsed > 0 && ` · ${currentRun.creditsUsed} credits used`}
                  </span>
                </div>

                {currentRun.steps.map((step, idx) => (
                  <StepCard key={step.id} step={step} isLast={idx === currentRun.steps.length - 1} />
                ))}

                {isRunning && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                    <span className="text-sm text-indigo-700">Agent is working...</span>
                  </div>
                )}

                <div ref={stepsEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── Artifacts Panel ── */}
        {currentRun && currentRun.steps.length > 0 && (
          <ArtifactsPanel steps={currentRun.steps} />
        )}
      </div>
    </div>
  );
}
