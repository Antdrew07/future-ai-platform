import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  Bot, Zap, Shield, Globe, Code2, Brain, ArrowRight, CheckCircle2,
  Sparkles, Terminal, Database, Cpu, Users, BarChart3, Key, ChevronRight,
  Play, Star, TrendingUp
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Autonomous Task Execution",
    description: "Agents that think, plan, and execute multi-step tasks end-to-end — just like Manus, but yours to customize.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Terminal,
    title: "Multi-Tool Integration",
    description: "Web search, code execution, file management, and API calls — all available to your agents out of the box.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Cpu,
    title: "Multi-Model LLM Routing",
    description: "Route tasks to GPT-4o, Claude 3.5 Sonnet, or our built-in Future Agent — with automatic cost optimization.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track every token, tool call, and credit spent. Full observability into your agent's performance.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite teammates, share agents, and collaborate on workflows with granular role-based access control.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Key,
    title: "Programmatic API Access",
    description: "Deploy agents and call them programmatically via REST API. Build products on top of Future.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
];

const STEPS = [
  { step: "01", title: "Build Your Agent", desc: "Write a system prompt, pick a model, enable tools. No code required." },
  { step: "02", title: "Deploy Instantly", desc: "One click to deploy. Get a shareable link or embed widget immediately." },
  { step: "03", title: "Run Autonomous Tasks", desc: "Give your agent a task. Watch it think, plan, and execute step by step." },
];

const STATS = [
  { value: "10M+", label: "Tasks Executed" },
  { value: "50K+", label: "Agents Deployed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "5 Models", label: "LLM Providers" },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Future</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="glow-primary">
                  Go to Dashboard <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost" size="sm">Sign in</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button size="sm" className="glow-primary">
                    Start for free
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "oklch(0.65 0.22 280)" }} />
        <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full opacity-8 blur-3xl"
          style={{ background: "oklch(0.65 0.18 200)" }} />

        <div className="container text-center relative z-10">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-medium border border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="w-3 h-3 mr-1.5" />
            The Autonomous AI Agent Platform
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            Build AI Agents That
            <br />
            <span className="gradient-text">Actually Work</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Create, deploy, and monetize autonomous AI agents powered by GPT-4o, Claude, and more.
            No code required. Real results delivered.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href={getLoginUrl()}>
              <Button size="lg" className="h-12 px-8 text-base font-semibold glow-primary">
                <Zap className="w-4 h-4 mr-2" />
                Start Building Free
              </Button>
            </a>
            <Link href="/templates">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                <Play className="w-4 h-4 mr-2" />
                See Templates
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Live Demo Preview ────────────────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="container">
          <div className="rounded-2xl border border-border/50 overflow-hidden glass max-w-4xl mx-auto">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/50">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full" style={{ background: "oklch(0.75 0.18 80 / 0.6)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "oklch(0.65 0.18 160 / 0.6)" }} />
              <span className="ml-3 text-xs text-muted-foreground font-mono">future-agent — task execution</span>
            </div>
            {/* Terminal content */}
            <div className="p-6 font-mono text-sm space-y-3 bg-card/30">
              <div className="flex items-start gap-3">
                <span className="text-primary">›</span>
                <span className="text-foreground">Research the latest AI trends and write a comprehensive report</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <span className="text-violet-400">◆</span>
                <span><span className="text-violet-400">Thinking:</span> Breaking down task into subtasks...</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <span className="text-cyan-400">⚡</span>
                <span><span className="text-cyan-400">web_search:</span> "AI trends 2025 latest developments"</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <span style={{ color: "oklch(0.65 0.18 160)" }}>✓</span>
                <span style={{ color: "oklch(0.65 0.18 160)" }}>Found 12 relevant sources. Analyzing content...</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <span className="text-cyan-400">⚡</span>
                <span><span className="text-cyan-400">code_execute:</span> Generating structured report with citations...</span>
              </div>
              <div className="flex items-start gap-3">
                <span style={{ color: "oklch(0.75 0.18 80)" }}>★</span>
                <span className="text-foreground">Report complete: <span className="text-primary">AI_Trends_Report_2025.md</span> (4,200 words)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
                <span>3 steps</span>
                <span>•</span>
                <span>12.4s</span>
                <span>•</span>
                <span>847 credits used</span>
                <span className="ml-auto flex items-center gap-1" style={{ color: "oklch(0.65 0.18 160)" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "oklch(0.65 0.18 160)" }} />
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 border border-border bg-secondary/50">
              Everything you need
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Built for <span className="gradient-text">serious builders</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From no-code agent creation to programmatic API access — Future scales with your ambition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title}
                className="p-6 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card transition-all duration-300 group">
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 border-y border-border/30"
        style={{ background: "oklch(0.10 0.006 260 / 0.5)" }}>
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">From idea to <span className="gradient-text">deployed agent</span></h2>
            <p className="text-muted-foreground">Three steps. Under five minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-black gradient-text">{step.step}</span>
                </div>
                <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Preview ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple, <span className="gradient-text">transparent pricing</span></h2>
            <p className="text-muted-foreground">Pay only for what you use. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Free", price: "$0", credits: "5,000 credits/mo", agents: "2 agents", cta: "Get started", highlight: false },
              { name: "Pro", price: "$29", credits: "50,000 credits/mo", agents: "20 agents", cta: "Start Pro", highlight: true },
              { name: "Business", price: "$99", credits: "200,000 credits/mo", agents: "Unlimited", cta: "Contact us", highlight: false },
            ].map((plan) => (
              <div key={plan.name}
                className={`p-6 rounded-xl border ${plan.highlight ? "border-primary/50 bg-primary/5 glow-primary" : "border-border/50 bg-card/50"}`}>
                {plan.highlight && (
                  <Badge className="mb-3 bg-primary text-primary-foreground text-xs">Most Popular</Badge>
                )}
                <div className="font-bold text-lg mb-1">{plan.name}</div>
                <div className="text-3xl font-black mb-4">
                  {plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </div>
                <div className="space-y-2 mb-6">
                  {[plan.credits, plan.agents, "API access", "Analytics"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <a href={getLoginUrl()}>
                  <Button className={`w-full ${plan.highlight ? "" : "variant-outline"}`}
                    variant={plan.highlight ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </a>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
              View full pricing details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="container">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5"
              style={{ background: "radial-gradient(ellipse at center, oklch(0.65 0.22 280), transparent 70%)" }} />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">
                Ready to build the <span className="gradient-text">future</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join thousands of builders creating autonomous AI agents that work 24/7.
                Start free, scale as you grow.
              </p>
              <a href={getLoginUrl()}>
                <Button size="lg" className="h-12 px-10 text-base font-semibold glow-primary">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Building for Free
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/30 py-12 px-4">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold">Future</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <a href="#" className="hover:text-foreground transition-colors">Docs</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            </div>
            <div className="text-xs text-muted-foreground">
              © 2025 Future AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
