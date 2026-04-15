import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  Bot, Zap, Shield, Globe, Code2, Brain, ArrowRight, CheckCircle2,
  Sparkles, Terminal, Database, Cpu, Users, BarChart3, Key, ChevronRight,
  Play, Star, TrendingUp, Layers, Rocket, Lock, RefreshCw, GitBranch,
  MessageSquare, FileText, Search, Workflow
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Autonomous Task Execution",
    description: "Agents that think, plan, and execute multi-step tasks end-to-end — fully autonomous, powered by Future's proprietary AI.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Globe,
    title: "Live Web Intelligence",
    description: "Real-time web search, page reading, and data extraction. Agents stay current with the latest information.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Code2,
    title: "Code Execution Engine",
    description: "Write, run, and iterate on Python, JavaScript, and bash code. Build full applications autonomously.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Cpu,
    title: "Multi-Model LLM Routing",
    description: "Future-1 Ultra, Pro, Code, Mini, and Fast — route tasks to the best Future model automatically.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: BarChart3,
    title: "Full Observability",
    description: "Track every token, tool call, and credit. Real-time analytics with step-by-step execution logs.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Key,
    title: "Programmatic API Access",
    description: "Deploy agents and call them via REST API. Build products on top of Future with your own API keys.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite teammates, share agents, and collaborate with granular role-based access control.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Layers,
    title: "Templates Marketplace",
    description: "Discover, clone, and publish agent templates. Monetize your best agents in the community marketplace.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2-ready infrastructure, encrypted secrets, isolated execution environments, and audit logs.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
];

const TOOLS = [
  { icon: Search, label: "Web Search", desc: "Real-time search" },
  { icon: Code2, label: "Code Execute", desc: "Python, JS, Bash" },
  { icon: FileText, label: "File Manager", desc: "Read & write files" },
  { icon: Globe, label: "API Calls", desc: "Any HTTP endpoint" },
  { icon: Brain, label: "Data Analysis", desc: "Structured insights" },
  { icon: Sparkles, label: "Image Gen", desc: "AI image creation" },
];

const MODELS = [
  { name: "Future-1 Ultra", provider: "Future AI", tier: "Ultra", color: "text-pink-400", desc: "Full autonomous mode" },
  { name: "Future-1 Pro", provider: "Future AI", tier: "Premium", color: "text-emerald-400", desc: "Multimodal, fast reasoning" },
  { name: "Future-1 Code", provider: "Future AI", tier: "Premium", color: "text-orange-400", desc: "Exceptional at coding & analysis" },
  { name: "Future-1 Mini", provider: "Future AI", tier: "Standard", color: "text-blue-400", desc: "Fast & cost-effective" },
  { name: "Future-1 Fast", provider: "Future AI", tier: "Standard", color: "text-violet-400", desc: "Fastest response times" },
];

const STEPS = [
  {
    step: "01",
    icon: Terminal,
    title: "Define Your Agent",
    desc: "Write a system prompt, choose a Future model, and toggle the tools your agent needs. No code required.",
  },
  {
    step: "02",
    icon: Rocket,
    title: "Deploy in One Click",
    desc: "Instantly deploy your agent. Get a shareable link, embed widget, or REST API endpoint — all ready immediately.",
  },
  {
    step: "03",
    icon: Workflow,
    title: "Run Autonomous Tasks",
    desc: "Give your agent a task. Watch it think, plan, search the web, write code, and deliver results step by step.",
  },
];

const STATS = [
  { value: "10M+", label: "Tasks Executed" },
  { value: "50K+", label: "Agents Deployed" },
  { value: "5", label: "LLM Providers" },
  { value: "99.9%", label: "Uptime SLA" },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    credits: "100 credits",
    features: ["3 agents", "Basic tools", "Community support", "Shareable links"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    credits: "8,000 credits",
    features: ["Unlimited agents", "All tools", "Priority support", "API access", "Team collaboration", "Advanced analytics"],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    credits: "50,000 credits",
    features: ["Everything in Pro", "Dedicated support", "Custom integrations", "SLA guarantee", "White-label options", "SSO"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Future</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/gallery" className="hover:text-foreground transition-colors">Gallery</Link>
            <Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#models" className="hover:text-foreground transition-colors">Models</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="glow-primary">
                  Dashboard <ArrowRight className="w-3 h-3 ml-1" />
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

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "oklch(0.65 0.22 280)" }} />
        <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full opacity-8 blur-3xl"
          style={{ background: "oklch(0.65 0.18 200)" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 opacity-5 blur-3xl"
          style={{ background: "oklch(0.65 0.22 280)" }} />

        <div className="container text-center relative z-10">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-medium border border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="w-3 h-3 mr-1.5" />
            The Autonomous AI Agent Ecosystem
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            AI Agents That
            <br />
            <span className="gradient-text">Do the Work</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
            Build and deploy autonomous AI agents powered by <strong className="text-foreground">Future's proprietary AI</strong>.
            They browse the web, write code, manage files, and complete complex tasks — end to end.
          </p>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10">
            No code required. Deploy in seconds. Scale to millions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href={getLoginUrl()}>
              <Button size="lg" className="h-12 px-8 text-base font-semibold glow-primary">
                <Zap className="w-4 h-4 mr-2" />
                Start Building Free
              </Button>
            </a>
            <Link href="/gallery">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                <Play className="w-4 h-4 mr-2" />
                Explore Agent Gallery
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

      {/* ─── Live Demo Terminal ─────────────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="container">
          <div className="rounded-2xl border border-border/50 overflow-hidden glass max-w-4xl mx-auto">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/50">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full" style={{ background: "oklch(0.75 0.18 80 / 0.6)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "oklch(0.65 0.18 160 / 0.6)" }} />
              <span className="ml-3 text-xs text-muted-foreground font-mono">future — autonomous execution</span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-mono">live</span>
              </div>
            </div>
            <div className="p-6 font-mono text-sm space-y-3 bg-card/30">
              <div className="flex items-start gap-3">
                <span className="text-primary">›</span>
                <span className="text-foreground">Research the top 5 AI startups in 2025 and write a detailed investor brief</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <span className="text-violet-400">◆</span>
                <span><span className="text-violet-400">Thinking:</span> Breaking task into subtasks — search, analyze, synthesize, format...</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <span className="text-cyan-400">⚡</span>
                <span><span className="text-cyan-400">web_search:</span> "top AI startups 2025 funding valuation"</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <span style={{ color: "oklch(0.65 0.18 160)" }}>✓</span>
                <span style={{ color: "oklch(0.65 0.18 160)" }}>Found 18 sources. Extracting funding data, team info, and product details...</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <span className="text-cyan-400">⚡</span>
                <span><span className="text-cyan-400">web_search:</span> "AI startup Series A B C 2025 valuations"</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <span className="text-cyan-400">⚡</span>
                <span><span className="text-cyan-400">code_execute:</span> Generating structured analysis with comparison tables...</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <span className="text-cyan-400">⚡</span>
                <span><span className="text-cyan-400">write_file:</span> investor_brief_2025.md (3,800 words)</span>
              </div>
              <div className="flex items-start gap-3">
                <span style={{ color: "oklch(0.75 0.18 80)" }}>★</span>
                <span className="text-foreground">Complete: <span className="text-primary">investor_brief_2025.md</span> — 5 companies, funding rounds, market analysis, risk assessment</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
                <span>6 steps</span>
                <span>•</span>
                <span>18.3s</span>
                <span>•</span>
                <span>1,240 credits</span>
                <span>•</span>
                <span>Future-1 Pro</span>
                <span className="ml-auto flex items-center gap-1" style={{ color: "oklch(0.65 0.18 160)" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "oklch(0.65 0.18 160)" }} />
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tool Arsenal ──────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">
              Every Tool Your Agent Needs
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Future agents come equipped with a full arsenal of tools — no plugins or integrations required.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {TOOLS.map((tool) => (
              <div key={tool.label} className="p-4 rounded-xl border border-border/50 bg-card/50 text-center hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <tool.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-semibold">{tool.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Models ────────────────────────────────────────────────────────── */}
      <section id="models" className="py-16 px-4 border-y border-border/30">
        <div className="container">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4 border border-border bg-secondary/50">
              Multi-Model Support
            </Badge>
            <h2 className="text-3xl font-bold mb-3">
              Powered by the <span className="gradient-text">World's Best AI</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Choose the right model for each agent. Future's proprietary model suite covers every use case — from lightning-fast responses to full autonomous task execution.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {MODELS.map((model) => (
              <div key={model.name} className="p-4 rounded-xl border border-border/50 bg-card/50 hover:border-primary/20 transition-colors">
                <div className={`text-xs font-bold mb-2 ${model.color}`}>{model.tier}</div>
                <div className="font-semibold text-sm mb-1">{model.name}</div>
                <div className="text-xs text-muted-foreground mb-2">{model.provider}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{model.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 border border-border bg-secondary/50">
              Simple by design
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              From idea to <span className="gradient-text">deployed agent</span> in minutes
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
                )}
                <div className="relative z-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-4xl font-black text-muted-foreground/20">{step.step}</div>
                  <h3 className="font-bold text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 border border-border bg-secondary/50">
              Everything you need
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Built for <span className="gradient-text">serious builders</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From no-code agent creation to enterprise-grade API access — Future scales with your ambition.
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

      {/* ─── Pricing Preview ───────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Simple, <span className="gradient-text">transparent pricing</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Start free. Scale as you grow. No surprise charges — credits only deduct when your agents actually run.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`p-6 rounded-2xl border transition-all duration-300 ${
                plan.highlight
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border/50 bg-card/50"
              }`}>
                {plan.highlight && (
                  <Badge className="mb-3 bg-primary text-primary-foreground text-xs">Most Popular</Badge>
                )}
                <div className="mb-4">
                  <div className="text-lg font-bold">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <div className="text-sm text-primary mt-1">{plan.credits} included</div>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={getLoginUrl()}>
                  <Button className={`w-full ${plan.highlight ? "glow-primary" : ""}`} variant={plan.highlight ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </a>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View full pricing details <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-border/30">
        <div className="container">
          <div className="relative rounded-3xl overflow-hidden border border-primary/20 bg-primary/5 p-12 text-center">
            <div className="absolute inset-0 opacity-5"
              style={{ background: "radial-gradient(ellipse at center, oklch(0.65 0.22 280), transparent 70%)" }} />
            <div className="relative z-10 space-y-6">
              <Badge variant="secondary" className="border border-primary/30 bg-primary/10 text-primary px-4 py-1.5">
                <Rocket className="w-3 h-3 mr-1.5" />
                Start building today
              </Badge>
              <h2 className="text-5xl font-black tracking-tight">
                The future of work is
                <br />
                <span className="gradient-text">autonomous agents</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                Join thousands of builders deploying AI agents that work 24/7 on their behalf.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href={getLoginUrl()}>
                  <Button size="lg" className="h-14 px-10 text-lg font-bold glow-primary">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Free — No Credit Card
                  </Button>
                </a>
                <Link href="/gallery">
                  <Button variant="outline" size="lg" className="h-14 px-10 text-lg">
                    Explore Gallery
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                100 free credits on signup · No credit card required · Deploy in under 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold">Future</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The autonomous AI agent ecosystem. Build, deploy, and scale AI agents powered by Future's proprietary AI.
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Platform</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/gallery" className="hover:text-foreground transition-colors">Agent Gallery</Link></li>
                <li><Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><a href={getLoginUrl()} className="hover:text-foreground transition-colors">Sign Up</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Developers</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-default">API Reference</span></li>
                <li><span className="cursor-default">SDKs</span></li>
                <li><span className="cursor-default">Webhooks</span></li>
                <li><span className="cursor-default">Status</span></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Company</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-default">About</span></li>
                <li><span className="cursor-default">Blog</span></li>
                <li><span className="cursor-default">Careers</span></li>
                <li><span className="cursor-default">Contact</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 Future AI. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="cursor-default hover:text-foreground transition-colors">Privacy Policy</span>
              <span className="cursor-default hover:text-foreground transition-colors">Terms of Service</span>
              <span className="cursor-default hover:text-foreground transition-colors">Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
