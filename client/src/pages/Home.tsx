import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  Code2,
  CreditCard,
  FileText,
  Globe,
  Image,
  Key,
  Layers,
  LineChart,
  Lock,
  Search,
  Shield,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

import { useEffect, useRef, useState } from "react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029617589/m5GbkNTBEjcM6aS7UZa8ie/future-logo_dd9d650b.png";

function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-2xl md:text-3xl font-heading font-bold gradient-text">
      {prefix}{count}{suffix}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const TOOLS = [
  { icon: Search, name: "Web Search", desc: "Real-time internet research" },
  { icon: Code2, name: "Code Execution", desc: "Write and run code live" },
  { icon: FileText, name: "File Operations", desc: "Create, read, manage files" },
  { icon: Globe, name: "API Calls", desc: "Connect to any external API" },
  { icon: Brain, name: "Data Analysis", desc: "Analyze and interpret data" },
  { icon: Image, name: "Image Generation", desc: "Create visuals from text" },
  { icon: Terminal, name: "System Commands", desc: "Execute shell operations" },
  { icon: Layers, name: "Multi-Step Tasks", desc: "Chain complex workflows" },
];

const MODELS = [
  { name: "Future-1 Ultra", tier: "Ultra", desc: "Most powerful autonomous agent", color: "from-violet-500 to-blue-500" },
  { name: "Future-1 Pro", tier: "Premium", desc: "Advanced reasoning engine", color: "from-blue-500 to-cyan-400" },
  { name: "Future-1 Code", tier: "Premium", desc: "Specialized for code tasks", color: "from-cyan-400 to-emerald-400" },
  { name: "Future-1 Mini", tier: "Standard", desc: "Fast and efficient", color: "from-emerald-400 to-yellow-400" },
  { name: "Future-1 Fast", tier: "Standard", desc: "Instant responses", color: "from-yellow-400 to-orange-400" },
];

const FEATURES = [
  { icon: Bot, title: "No-Code Agent Builder", desc: "Design autonomous agents with a visual editor. Configure tools, memory, and behavior without writing a single line of code." },
  { icon: Zap, title: "Autonomous Execution", desc: "Agents think, plan, and execute multi-step tasks independently. Watch them work in real-time with live streaming logs." },
  { icon: LineChart, title: "Usage Analytics", desc: "Track every task, token, and credit in real-time. Beautiful dashboards with deep insights into agent performance." },
  { icon: CreditCard, title: "Credit System", desc: "Flexible pay-as-you-go credits with subscription plans. Transparent pricing per model tier." },
  { icon: Key, title: "API Access", desc: "Programmatic access to your deployed agents via REST API. Build agent-powered products at scale." },
  { icon: Users, title: "Team Collaboration", desc: "Invite team members, share agents, and collaborate on complex workflows together." },
  { icon: Shield, title: "Enterprise Security", desc: "Role-based access control, audit logs, and secure multi-tenant architecture." },
  { icon: Lock, title: "Templates Marketplace", desc: "Browse, publish, and monetize agent templates. Build once, sell to the community." },
];

const PLANS = [
  { name: "Free", price: "$0", period: "/mo", credits: "100 credits", features: ["1 agent", "Basic tools", "Community support"], highlight: false },
  { name: "Starter", price: "$19", period: "/mo", credits: "2,000 credits", features: ["5 agents", "All tools", "Priority support", "API access"], highlight: false },
  { name: "Pro", price: "$49", period: "/mo", credits: "8,000 credits", features: ["Unlimited agents", "All tools", "Priority support", "API access", "Team features"], highlight: true },
  { name: "Enterprise", price: "$199", period: "/mo", credits: "50,000 credits", features: ["Unlimited everything", "Dedicated support", "Custom models", "SSO", "SLA"], highlight: false },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Future" className="h-8 w-8 object-contain" />
            <span className="text-lg font-heading font-bold tracking-tight">Future</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#models" className="hover:text-foreground transition-colors">Models</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link href="/gallery" className="hover:text-foreground transition-colors">Gallery</Link>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-primary hover:bg-primary/90 glow-subtle text-sm font-medium px-5">
                  Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">Sign In</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button className="bg-primary hover:bg-primary/90 glow-subtle text-sm font-medium px-5">
                    Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] float" style={{ background: "oklch(0.65 0.27 285 / 0.12)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] float" style={{ background: "oklch(0.65 0.20 250 / 0.08)", animationDelay: "-3s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] float" style={{ background: "oklch(0.80 0.15 85 / 0.05)", animationDelay: "-1.5s" }} />
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(oklch(0.65 0.27 285 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(0.65 0.27 285 / 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium glass border-gradient">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span className="gradient-text-gold">The Future of AI is Here</span>
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight leading-[0.95]">
            <span className="text-foreground">Build </span>
            <span className="gradient-text">Autonomous</span>
            <br />
            <span className="text-foreground">AI Agents</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Create intelligent agents that browse the web, write code, manage files, and complete
            complex tasks — all powered by Future's proprietary AI engine.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary text-base font-semibold px-8 py-6 rounded-xl">
                Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-base font-medium px-8 py-6 rounded-xl border-border/50 bg-transparent hover:bg-accent">
                Explore Platform
              </Button>
            </a>
          </motion.div>

          {/* Stats with animated counters */}
          <motion.div variants={fadeUp} className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <AnimatedCounter target={8} suffix="+" />
              <div className="text-xs text-muted-foreground mt-1">Built-in Tools</div>
            </div>
            <div className="text-center">
              <AnimatedCounter target={5} />
              <div className="text-xs text-muted-foreground mt-1">AI Models</div>
            </div>
            <div className="text-center">
              <AnimatedCounter target={99} suffix=".9%" />
              <div className="text-xs text-muted-foreground mt-1">Uptime</div>
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ═══ TOOLS ARSENAL ═══ */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-sm font-medium gradient-text-gold uppercase tracking-widest mb-3">Capabilities</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-heading font-bold">
              Everything Your Agent Needs
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A complete toolkit for autonomous task execution. Your agents can do anything a human can do on a computer.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            {TOOLS.map((tool) => (
              <motion.div
                key={tool.name}
                variants={fadeUp}
                className="bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all p-5 text-center group"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <tool.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-sm">{tool.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="divider-gradient mx-auto max-w-4xl" />

      {/* ═══ MODELS ═══ */}
      <section id="models" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-sm font-medium text-primary uppercase tracking-widest mb-3">AI Models</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-heading font-bold">
              Proprietary Intelligence
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Five purpose-built models, each optimized for different workloads. From ultra-powerful reasoning to lightning-fast responses.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            {MODELS.map((model) => (
              <motion.div
                key={model.name}
                variants={fadeUp}
                className="bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all p-5 relative overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${model.color}`} />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{model.tier}</span>
                <h3 className="font-heading font-bold text-base mt-2">{model.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{model.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="divider-gradient mx-auto max-w-4xl" />

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-sm font-medium text-cyan uppercase tracking-widest mb-3">Platform</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-heading font-bold">
              Built for Scale
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all p-6 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-sm mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="divider-gradient mx-auto max-w-4xl" />

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-sm font-medium gradient-text-gold uppercase tracking-widest mb-3">Process</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-heading font-bold">
              Three Steps to Intelligence
            </motion.h2>
          </motion.div>

          <motion.div
            className="space-y-6"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            {[
              { step: "01", title: "Design Your Agent", desc: "Configure your agent's personality, tools, and behavior using our no-code builder. Choose a model tier and set permissions." },
              { step: "02", title: "Deploy Instantly", desc: "Your agent goes live immediately. Share it via a link, embed it on your site, or access it through our API." },
              { step: "03", title: "Watch It Work", desc: "Submit tasks and watch your agent think, plan, and execute in real-time. Every step is streamed live to your workspace." },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all p-8 flex items-start gap-6"
              >
                <span className="text-4xl font-heading font-bold gradient-text-gold shrink-0">{item.step}</span>
                <div>
                  <h3 className="font-heading font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="divider-gradient mx-auto max-w-4xl" />

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Pricing</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-heading font-bold">
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Start free. Scale as you grow. No hidden fees.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            {PLANS.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={`rounded-xl p-6 card-hover relative ${
                  plan.highlight
                    ? "glass-strong border-gradient glow-subtle"
                    : "glass"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="font-heading font-semibold text-sm text-muted-foreground">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-heading font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-primary mt-1 font-medium">{plan.credits}</p>
                <div className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <a href={isAuthenticated ? "/billing" : getLoginUrl()} className="block mt-6">
                  <Button
                    className={`w-full text-xs font-medium ${
                      plan.highlight
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    }`}
                    size="sm"
                  >
                    {plan.price === "$0" ? "Start Free" : "Get Started"}
                  </Button>
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-heading font-bold">
              Ready to Build the <span className="gradient-text">Future</span>?
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground text-lg">
              Join thousands of builders creating the next generation of AI-powered products.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8">
              <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary text-base font-semibold px-10 py-6 rounded-xl">
                  Get Started — It's Free <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <div className="divider-gradient mx-auto max-w-4xl" />
      <footer className="relative border-t border-border/30 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Future" className="h-6 w-6 object-contain opacity-60" />
            <span className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Future. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/gallery" className="hover:text-foreground transition-colors">Gallery</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
