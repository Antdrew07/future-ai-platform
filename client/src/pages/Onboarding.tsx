import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sparkles, Globe, Code2, ArrowRight,
  CheckCircle2, Bot, Play, Rocket, Send,
  Smartphone, Briefcase, ShoppingBag,
  TrendingUp, FileText, Megaphone,
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029617589/m5GbkNTBEjcM6aS7UZa8ie/future-logo_dd9d650b.png";

const STEPS = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "What to build" },
  { id: 3, title: "Ready" },
];

const SUGGESTIONS = [
  { icon: Globe,        label: "Build a website",          prompt: "Build a professional website for my business. I'll describe what I need and you'll handle the rest." },
  { icon: Smartphone,   label: "Build an iPhone app",      prompt: "Help me build an iPhone app. I'll describe my idea and you'll guide me through the entire process — design, code, and launch." },
  { icon: Smartphone,   label: "Build an Android app",     prompt: "Help me build an Android app. I'll describe my idea and you'll handle everything from design to launch." },
  { icon: Briefcase,    label: "Launch a business",        prompt: "Help me launch a business. I have an idea and I need a business plan, brand name, website, and first steps." },
  { icon: ShoppingBag,  label: "Start an online store",    prompt: "Help me start an online store. I'll describe what I'm selling and you'll set up everything — products, payments, and design." },
  { icon: TrendingUp,   label: "Write a book",             prompt: "Help me write a book. I'll describe the topic or story idea and you'll write the full manuscript." },
  { icon: Megaphone,    label: "Create a marketing plan",  prompt: "Create a marketing plan for my business. I'll describe my product and target customers." },
  { icon: FileText,     label: "Write a business plan",    prompt: "Write a complete business plan for my idea, including market research, financials, and growth strategy." },
  { icon: Rocket,       label: "Grow my social media",     prompt: "Help me grow my social media. I'll describe my brand and you'll create a content strategy and posts." },
  { icon: Code2,        label: "Write & run code",          prompt: "Write and run code to solve a problem for me. I'll describe exactly what I need." },
];

function buildAgent(task: string) {
  const lower = task.toLowerCase();
  if (lower.includes("ios") || lower.includes("iphone") || lower.includes("swift")) {
    return { name: "iOS Developer", systemPrompt: "You are an expert iOS developer. Guide users through building iOS apps — from idea to architecture, Swift code, and App Store submission." };
  }
  if (lower.includes("android") || lower.includes("kotlin") || lower.includes("google play")) {
    return { name: "Android Developer", systemPrompt: "You are an expert Android developer. Guide users through building Android apps — from idea to architecture, Kotlin code, and Play Store submission." };
  }
  if (lower.includes("website") || lower.includes("web app") || lower.includes("landing") || lower.includes("saas")) {
    return { name: "Web Builder", systemPrompt: "You are an expert web developer. Build clean, modern websites and web apps based on user requirements." };
  }
  if (lower.includes("business") || lower.includes("launch") || lower.includes("startup") || lower.includes("entrepreneur")) {
    return { name: "Business Advisor", systemPrompt: "You are a seasoned business advisor. Help users launch businesses — from idea validation, business plans, branding, legal setup, to finding first customers." };
  }
  if (lower.includes("store") || lower.includes("shop") || lower.includes("ecommerce") || lower.includes("product")) {
    return { name: "E-Commerce Builder", systemPrompt: "You are an e-commerce specialist. Help set up online stores, product listings, payment systems, and great shopping experiences." };
  }
  if (lower.includes("social media") || lower.includes("instagram") || lower.includes("tiktok") || lower.includes("grow")) {
    return { name: "Social Media Strategist", systemPrompt: "You are a social media growth expert. Help users build their brand, create content strategies, and grow their audience." };
  }
  if (lower.includes("marketing") || lower.includes("campaign") || lower.includes("advertis")) {
    return { name: "Marketing Strategist", systemPrompt: "You are a marketing expert. Create comprehensive marketing plans, campaigns, and growth strategies." };
  }
  if (lower.includes("business plan") || lower.includes("plan") || lower.includes("financ")) {
    return { name: "Business Planner", systemPrompt: "You are an expert business planner. Write detailed, investor-ready business plans with market analysis and financial projections." };
  }
  if (lower.includes("code") || lower.includes("script") || lower.includes("program")) {
    return { name: "Code Engineer", systemPrompt: "You are an expert software engineer. Write clean, well-documented code, explain your approach, and execute it to verify correctness." };
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_URL} alt="Future" className="w-8 h-8 object-contain" />
          <span className="font-heading font-bold text-foreground text-sm">Future</span>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => navigate("/dashboard")}>
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
                  ? "bg-primary text-primary-foreground"
                  : step === s.id
                  ? "ring-2 ring-primary/40 bg-primary/10 text-primary"
                  : "bg-muted ring-1 ring-border text-muted-foreground"
              }`}>
                {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className={`hidden sm:block text-xs font-medium ${step >= s.id ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 rounded-full ${step > s.id ? "bg-primary" : "bg-border"}`} />
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
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                  <img src={LOGO_URL} alt="Future" className="w-14 h-14 object-contain" />
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                  Welcome to <span className="gradient-text">Future</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Your personal AI assistant. Tell it what you want to create — a website, app, book, business, or anything else — and it handles everything for you.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Globe, label: "Web Search", bg: "bg-blue-50", iconColor: "text-blue-600" },
                  { icon: Code2, label: "Code Execution", bg: "bg-emerald-50", iconColor: "text-emerald-600" },
                  { icon: Bot, label: "Multi-Model AI", bg: "bg-violet-50", iconColor: "text-violet-600" },
                ].map((item) => (
                  <div key={item.label} className="bg-white border border-border rounded-xl p-4 text-center shadow-sm">
                    <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mx-auto mb-2`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" className="h-11 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-semibold" onClick={() => setStep(2)}>
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Task Prompt */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading font-bold text-foreground">What do you want to create?</h2>
                <p className="text-xs text-muted-foreground">Just describe it in plain English — no tech skills needed</p>
              </div>

              {/* Main prompt box */}
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
                <textarea
                  ref={textareaRef}
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Build me an iPhone app for my restaurant, or write a business plan for my bakery…"
                  rows={4}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm px-5 pt-5 pb-3 resize-none outline-none font-sans leading-relaxed"
                />
                <div className="flex items-center justify-between px-4 pb-4">
                  <span className="text-[11px] text-muted-foreground">Press Enter to start · Shift+Enter for new line</span>
                  <button
                    onClick={handleStart}
                    disabled={!task.trim() || createAgent.isPending}
                    className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground text-xs font-semibold transition-all duration-200 shadow-sm"
                  >
                    {createAgent.isPending ? (
                      <>
                        <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
                <p className="text-[11px] text-muted-foreground mb-3 text-center uppercase tracking-widest">Or choose a task</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleSuggestion(s.prompt)}
                      className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full border text-xs font-medium transition-all duration-150 ${
                        task === s.prompt
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-primary/5"
                      }`}
                    >
                      <s.icon className="w-3 h-3" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setStep(1)}>
                  ← Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-heading font-bold text-foreground">
                  Your agent is ready!
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Launch the workspace and Future will start working on your task right away.
                </p>
              </div>

              <div className="bg-white border border-border rounded-xl p-6 max-w-sm mx-auto shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-heading font-semibold text-foreground text-sm">{createdAgentName}</div>
                    <div className="text-[10px] text-muted-foreground">Future-1 Ultra · Ready to run</div>
                  </div>
                </div>
                {task && (
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2 text-left">{task}</p>
                )}
              </div>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                {createdAgentId && (
                  <Button size="lg" className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-semibold" onClick={() => navigate(`/workspace/${createdAgentId}?task=${encodeURIComponent(task)}`)}>
                    <Play className="w-4 h-4 mr-2" />
                    Launch Workspace
                  </Button>
                )}
                <Button variant="outline" className="h-11 border-border bg-white text-foreground hover:bg-accent" onClick={() => navigate("/dashboard")}>
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
