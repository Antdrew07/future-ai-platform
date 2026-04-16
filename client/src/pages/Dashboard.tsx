import { useState, useRef, useEffect } from "react";
import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowUp, Globe, Code2, Search, BarChart3, FileText,
  Zap, ShoppingBag, CheckCircle2, Clock, XCircle, Activity,
  Bot, Loader2
} from "lucide-react";

const SUGGESTIONS = [
  { icon: Globe,       label: "Build a website",          prompt: "Build a modern landing page for my business" },
  { icon: Code2,       label: "Write & run code",          prompt: "Write a Python script to analyze CSV data" },
  { icon: Search,      label: "Research a topic",          prompt: "Research the latest trends in AI agents" },
  { icon: BarChart3,   label: "Analyze data",              prompt: "Analyze this dataset and create visualizations" },
  { icon: FileText,    label: "Write content",             prompt: "Write a professional blog post about AI" },
  { icon: Zap,         label: "Automate a workflow",       prompt: "Automate my email newsletter workflow" },
  { icon: ShoppingBag, label: "Build an online store",     prompt: "Create an e-commerce store with product listings" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "failed")    return <XCircle className="w-4 h-4 text-red-400" />;
  if (status === "running")   return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
  return <Clock className="w-4 h-4 text-white/30" />;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery({ limit: 6, offset: 0 });
  const { data: agents } = trpc.agents.list.useQuery();
  const { data: balance } = trpc.credits.balance.useQuery();

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const getOrCreateAgent = async (): Promise<number> => {
    // Use first existing agent, or create a default one
    if (agents && agents.length > 0) return agents[0].id;
    return 1; // fallback — workspace will handle missing agent gracefully
  };

  const handleSubmit = async () => {
    const task = input.trim();
    if (!task || isSubmitting) return;
    setIsSubmitting(true);
    const agentId = await getOrCreateAgent();
    navigate(`/workspace/${agentId}?task=${encodeURIComponent(task)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <FutureDashboardLayout showNewAgent={false}>
      <div className="min-h-full flex flex-col">
        {/* ── Hero / Prompt Area ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-12 pb-6 max-w-3xl mx-auto w-full">
          {/* Greeting */}
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-1 text-center">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mb-8 text-center">
            What would you like Future to help you with today?
          </p>

          {/* Prompt Box */}
          <div className="w-full glass rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/30 overflow-hidden">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Future anything — build a website, analyze data, write code..."
                rows={1}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none px-5 pt-4 pb-3 pr-14 focus:outline-none leading-relaxed"
                style={{ minHeight: "56px" }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isSubmitting}
                className="absolute right-3 bottom-3 w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg shadow-primary/20"
              >
                {isSubmitting
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <ArrowUp className="w-4 h-4 text-white" />
                }
              </button>
            </div>

            {/* Suggestion chips */}
            <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-white/[0.04] pt-3">
              {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => setInput(prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-150"
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Credits pill */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Zap className="w-3 h-3 text-gold/60" />
            <span>{balance?.toLocaleString() ?? "—"} credits available</span>
            <span className="mx-1">·</span>
            <Link href="/dashboard/billing" className="text-primary/70 hover:text-primary transition-colors">Top up</Link>
          </div>
        </div>

        {/* ── Recent Tasks ── */}
        <div className="max-w-3xl mx-auto w-full px-4 pb-10">
          {tasksLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.04]" />
              ))}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Recent</span>
                <Link href="/dashboard/agents" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  View all →
                </Link>
              </div>
              <div className="space-y-1.5">
                {tasks.map(task => (
                  <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all duration-150 cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                        <StatusIcon status={task.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground/50 mt-0.5">
                          {new Date(task.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          {task.creditsUsed > 0 && ` · ${task.creditsUsed} credits`}
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        task.status === "completed" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        task.status === "failed"    ? "text-red-400 bg-red-500/10 border-red-500/20" :
                        task.status === "running"   ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                        "text-white/30 bg-white/[0.03] border-white/[0.06]"
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mx-auto mb-3">
                <Bot className="w-5 h-5 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground/50">Your recent tasks will appear here</p>
            </div>
          )}
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
