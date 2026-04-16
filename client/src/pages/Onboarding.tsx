import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sparkles, Globe, Code2, Cpu, ArrowRight,
  CheckCircle2, Bot, Play, Rocket, Send,
  Globe2, FileCode2, BarChart2, Presentation,
  Workflow, Pencil, Search, ShoppingCart,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "What to build" },
  { id: 3, title: "Ready" },
];

// Practical suggestion chips — Manus/twin-style
const SUGGESTIONS = [
  { icon: Globe2,        label: "Build a website",         prompt: "Build a modern website for my business. I'll describe what I need." },
  { icon: FileCode2,     label: "Write & run code",        prompt: "Write and run code to solve a problem for me." },
  { icon: Search,        label: "Research a topic",        prompt: "Research a topic thoroughly and give me a comprehensive summary." },
  { icon: BarChart2,     label: "Analyze data",            prompt: "Analyze a dataset and give me insights and visualizations." },
  { icon: Presentation,  label: "Create a presentation",   prompt: "Create a polished presentation or slide deck for me." },
  { icon: Workflow,      label: "Automate a workflow",     prompt: "Help me automate a repetitive task or workflow." },
  { icon: ShoppingCart,  label: "Build an online store",   prompt: "Help me set up an e-commerce store or product listing." },
  { icon: Pencil,        label: "Write content",           prompt: "Write high-quality content — blog posts, emails, copy, or reports." },
];

// Map a task prompt to a sensible agent name + system prompt
function buildAgent(task: string) {
  const lower = task.toLowerCase();
  if (lower.includes("website") || lower.includes("web app") || lower.includes("landing")) {
    return { name: "Web Builder", systemPrompt: "You are an expert web developer. Build clean, modern websites and web apps based on user requirements. Write code, explain your choices, and iterate until the user is satisfied." };
  }
  if (lower.includes("code") || lower.includes("script") || lower.includes("program")) {
    return { name: "Code Engineer", systemPrompt: "You are an expert software engineer. Write clean, well-documented code, explain your approach, and execute it to verify correctness." };
  }
  if (lower.includes("research") || lower.includes("summary") || lower.includes("report")) {
    return { name: "Research Assistant", systemPrompt: "You are a research assistant. Search the web thoroughly, gather information from multiple sources, and produce a well-structured, comprehensive report." };
  }
  if (lower.includes("data") || lower.includes("analyz") || lower.includes("dataset") || lower.includes("chart")) {
    return { name: "Data Analyst", systemPrompt: "You are a data analyst. Analyze data thoroughly, identify patterns and trends, and present findings clearly with actionable insights and visualizations." };
  }
  if (lower.includes("presentation") || lower.includes("slide") || lower.includes("deck")) {
    return { name: "Presentation Designer", systemPrompt: "You are an expert at creating compelling presentations. Design clear, visually appealing slide decks with strong narratives and concise content." };
  }
  if (lower.includes("automat") || lower.includes("workflow") || lower.includes("task")) {
    return { name: "Automation Agent", systemPrompt: "You are an automation expert. Identify repetitive tasks, design efficient workflows, and build scripts or integrations to automate them." };
  }
  if (lower.includes("store") || lower.includes("shop") || lower.includes("ecommerce") || lower.includes("product")) {
    return { name: "E-Commerce Builder", systemPrompt: "You are an e-commerce specialist. Help set up online stores, product listings, and shopping experiences." };
  }
  if (lower.includes("write") || lower.includes("content") || lower.includes("blog") || lower.includes("copy")) {
    return { name: "Content Writer", systemPrompt: "You are a skilled content writer. Produce high-quality, engaging written content tailored to the audience and purpose." };
  }
  return { name: "AI Assistant", systemPrompt: "You are a highly capable AI assistant. Complete tasks thoroughly, explain your reasoning, and ask clarifying questions when needed." };
}

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [task, setTask] = useState("");
  const [createdAgentId, setCreatedAgentId] = useState<number | null>(null);
  const [createdAgentName, setCreatedAgentName] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createAgent = trpc.agents.create.useMutation({
    onSuccess: (agent) => {
      setCreatedAgentId(agent.id);
      setCreatedAgentName(agent.name);
      setStep(3);
    },
    onError: (err) => toast.error("Failed to start: " + err.message),
  });

  const handleStart = () => {
    const trimmed = task.trim();
    if (!trimmed) { toast.error("Please describe what you'd like to do"); return; }
    const { name, systemPrompt } = buildAgent(trimmed);
    createAgent.mutate({
      name,
      description: trimmed.slice(0, 200),
      systemPrompt,
      modelId: "future-agent-1",
      webSearchEnabled: true,
      codeExecutionEnabled: true,
      fileUploadEnabled: true,
      apiCallsEnabled: true,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  const handleSuggestion = (prompt: string) => {
    setTask(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#06060a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-heading font-bold text-white text-sm">Future</span>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-white/40 hover:text-white" onClick={() => navigate("/dashboard")}>
          Skip for now
        </Button>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-3 py-6 px-4">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.id
                  ? "bg-gradient-to-br from-violet-500 to-blue-600 text-white"
                  : step === s.id
                  ? "ring-2 ring-violet-500/50 bg-violet-500/10 text-violet-300"
                  : "bg-white/[0.03] ring-1 ring-white/[0.06] text-white/20"
              }`}>
                {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className={`hidden sm:block text-xs font-medium ${step >= s.id ? "text-white/70" : "text-white/20"}`}>{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 rounded-full ${step > s.id ? "bg-gradient-to-r from-violet-500 to-blue-600" : "bg-white/[0.06]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mx-auto shadow-2xl shadow-violet-500/30">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">
                  Welcome to <span className="gradient-text">Future</span>
                </h1>
                <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
                  Your autonomous AI that browses the web, writes code, manages files, and completes complex tasks — all on your behalf.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Globe, label: "Web Search", gradient: "from-blue-500/20 to-cyan-500/20" },
                  { icon: Code2, label: "Code Execution", gradient: "from-emerald-500/20 to-green-500/20" },
                  { icon: Cpu, label: "Multi-Model AI", gradient: "from-violet-500/20 to-purple-500/20" },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-xl p-4 text-center">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-2 ring-1 ring-white/[0.06]`}>
                      <item.icon className="w-5 h-5 text-white/50" />
                    </div>
                    <span className="text-xs font-medium text-white/60">{item.label}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" className="h-11 px-10 glow-primary font-heading font-semibold" onClick={() => setStep(2)}>
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Task Prompt — Manus-style */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading font-bold text-white">What can I help you with?</h2>
                <p className="text-xs text-white/40">Describe your task and Future will get to work</p>
              </div>

              {/* Main prompt box */}
              <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden focus-within:border-violet-500/40 transition-colors duration-200">
                <textarea
                  ref={textareaRef}
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Build me a landing page for my SaaS product, or research the latest AI trends and write a report…"
                  rows={4}
                  className="w-full bg-transparent text-white/90 placeholder:text-white/20 text-sm px-5 pt-5 pb-3 resize-none outline-none font-sans leading-relaxed"
                />
                <div className="flex items-center justify-between px-4 pb-4">
                  <span className="text-[11px] text-white/20">Press Enter to start · Shift+Enter for new line</span>
                  <button
                    onClick={handleStart}
                    disabled={!task.trim() || createAgent.isPending}
                    className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all duration-200 shadow-lg shadow-violet-500/20"
                  >
                    {createAgent.isPending ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Starting…
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        Start
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestion chips */}
              <div>
                <p className="text-[11px] text-white/25 mb-3 text-center uppercase tracking-widest">Or choose a task</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleSuggestion(s.prompt)}
                      className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full border text-xs font-medium transition-all duration-150 ${
                        task === s.prompt
                          ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                          : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80 hover:bg-white/[0.05]"
                      }`}
                    >
                      <s.icon className="w-3 h-3" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" size="sm" className="text-xs text-white/30 hover:text-white/60" onClick={() => setStep(1)}>
                  ← Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-heading font-bold text-white">
                  Your agent is ready!
                </h1>
                <p className="text-sm text-white/40 max-w-md mx-auto">
                  Launch the workspace and Future will start working on your task right away.
                </p>
              </div>

              <div className="glass rounded-xl p-6 max-w-sm mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-white/[0.06]">
                    <Bot className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="text-left">
                    <div className="font-heading font-semibold text-white text-sm">{createdAgentName}</div>
                    <div className="text-[10px] text-white/30">Future-1 Ultra · Ready to run</div>
                  </div>
                </div>
                {task && (
                  <p className="text-xs text-white/30 mt-3 leading-relaxed line-clamp-2 text-left">{task}</p>
                )}
              </div>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                {createdAgentId && (
                  <Button size="lg" className="h-11 glow-primary font-heading font-semibold" onClick={() => navigate(`/workspace/${createdAgentId}?task=${encodeURIComponent(task)}`)}>
                    <Play className="w-4 h-4 mr-2" />
                    Launch Workspace
                  </Button>
                )}
                <Button variant="outline" className="h-11 border-white/[0.06] bg-white/[0.02] text-white/60" onClick={() => navigate("/dashboard")}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
