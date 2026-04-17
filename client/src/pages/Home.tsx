import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowRight, CheckCircle2, Star, Smartphone, Globe, BookOpen,
  TrendingUp, ShoppingBag, Megaphone, ChevronRight, Menu, X,
  Sparkles, Zap, MessageSquare, Heart, Shield, Clock
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029617589/m5GbkNTBEjcM6aS7UZa8ie/future-logo_dd9d650b.png";

// Apple logo SVG
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

// Android logo SVG
const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0012 1.5c-.96 0-1.86.23-2.66.63L7.85.65c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.983 5.983 0 006 8h12a5.983 5.983 0 00-2.47-5.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
  </svg>
);

const USE_CASES = [
  {
    emoji: "📱",
    title: "I'll build your app",
    subtitle: "iPhone & Android",
    desc: "Tell me your app idea and I'll design it, code it, and get it ready to launch — just like that. No programming needed from you.",
    tags: ["iOS", "Android"],
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    showPlatforms: true,
  },
  {
    emoji: "🌐",
    title: "I'll build your website",
    subtitle: "Beautiful & ready to go live",
    desc: "Need a website for your business, portfolio, or store? I'll design it, write the copy, and have it live — all in one conversation.",
    tags: ["Business", "Portfolio", "Store"],
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    showPlatforms: false,
  },
  {
    emoji: "📖",
    title: "I'll write your book",
    subtitle: "Fiction, guides, or memoirs",
    desc: "That book you've been meaning to write? Tell me the idea and I'll write it, chapter by chapter, until it's finished and ready to publish.",
    tags: ["Fiction", "Non-Fiction", "Self-Help"],
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
    showPlatforms: false,
  },
  {
    emoji: "🚀",
    title: "I'll launch your business",
    subtitle: "From idea to open for business",
    desc: "Business plan, brand name, marketing strategy, website — I'll put it all together so you can focus on what you love.",
    tags: ["Startups", "Small Business", "Side Hustles"],
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    showPlatforms: false,
  },
  {
    emoji: "🛒",
    title: "I'll set up your online store",
    subtitle: "Sell anything, anywhere",
    desc: "Product descriptions, store design, pricing strategy — I'll handle every detail so your store is ready to take orders today.",
    tags: ["E-commerce", "Products", "Dropshipping"],
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-50",
    border: "border-pink-100",
    showPlatforms: false,
  },
  {
    emoji: "📣",
    title: "I'll grow your audience",
    subtitle: "Marketing that actually works",
    desc: "Social posts, ad copy, email campaigns, SEO content — I'll create everything you need to reach more people and grow your brand.",
    tags: ["Social Media", "Ads", "Email"],
    color: "from-cyan-500 to-blue-500",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    showPlatforms: false,
  },
];

const COMPANION_TRAITS = [
  {
    icon: Heart,
    title: "I'm always in your corner",
    desc: "I genuinely care about your success. Whatever you're working toward — I'm here to help you get there, every single step of the way.",
    color: "text-rose-500 bg-rose-50",
  },
  {
    icon: Clock,
    title: "I never sleep, never stop",
    desc: "Day or night, weekday or weekend — I'm always ready when you are. Your goals don't wait, and neither do I.",
    color: "text-violet-500 bg-violet-50",
  },
  {
    icon: Shield,
    title: "I keep your ideas safe",
    desc: "Your ideas, your work, your future. Everything you share with me stays private and secure — always.",
    color: "text-emerald-500 bg-emerald-50",
  },
  {
    icon: Zap,
    title: "I work fast",
    desc: "What would take you weeks, I can do in minutes. I move at the speed of your ambition — no waiting, no delays.",
    color: "text-amber-500 bg-amber-50",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Small Business Owner",
    text: "I finally feel like I have someone in my corner. I told Future what I needed and it just... did it. My store is up, my customers are happy, and I didn't have to figure anything out alone.",
    stars: 5,
  },
  {
    name: "James T.",
    role: "First-Time Author",
    text: "I'd been carrying this book idea for 3 years, too scared to start. Future helped me write it, chapter by chapter. It's now published on Amazon. I couldn't have done it without this.",
    stars: 5,
  },
  {
    name: "Priya K.",
    role: "Entrepreneur",
    text: "Having Future feels like having a brilliant business partner who's available 24/7 and never judges your ideas. My app is live, my business is growing, and I feel unstoppable.",
    stars: 5,
  },
];

const EXAMPLES = [
  "Build me an iPhone app for booking dog walkers",
  "Write a 200-page fantasy novel about a dragon who becomes a chef",
  "Create a complete business plan for my coffee shop",
  "Build a website for my photography business with a booking form",
  "Write 30 days of Instagram posts for my fitness brand",
  "Design an online store for my handmade jewelry",
];

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(current));
          }, duration / steps);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setExampleIdx((i) => (i + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(t);
  }, []);

  const loginUrl = isAuthenticated ? "/dashboard" : getLoginUrl();

  return (
    <div className="min-h-screen bg-white text-foreground">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Future" className="h-8 w-auto" />
            <span className="font-black text-xl tracking-tight">Future</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#what-i-can-do" className="hover:text-foreground transition-colors">What I can do</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/gallery" className="hover:text-foreground transition-colors">Gallery</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold px-5">
                  Go to Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign in</Button>
                </Link>
                <a href={getLoginUrl()}>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold px-5">
                    Meet your Future <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </a>
              </>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-accent" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-1">
            <a href="#what-i-can-do" className="block text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>What I can do</a>
            <a href="#how-it-works" className="block text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <Link href="/pricing" className="block text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <div className="pt-3 flex flex-col gap-2">
              <Link href="/signin"><Button variant="outline" className="w-full">Sign in</Button></Link>
              <a href={getLoginUrl()}><Button className="w-full bg-primary text-white font-semibold">Meet your Future</Button></a>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50/70 via-white to-white pt-16 pb-24 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-radial from-violet-100/50 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-violet-200 rounded-full px-4 py-1.5 text-sm font-semibold text-violet-700 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            Your personal AI companion — always in your corner
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Tell me what you want.
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              I'll do the work for you.
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed font-medium">
            I'm Future — your personal AI. I build apps, write books, launch businesses, and create websites. You just tell me what you want.
          </p>
          <p className="text-base text-muted-foreground/70 max-w-xl mx-auto mb-10">
            Think of me as the brilliant, tireless friend you've always wished you had — one who can do almost anything, is available 24/7, and genuinely wants to see you succeed.
          </p>

          {/* Animated example prompt */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="bg-white border border-border rounded-2xl px-5 py-4 shadow-sm flex items-start gap-3 text-left min-h-[64px]">
              <MessageSquare className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground transition-all duration-500">
                "{EXAMPLES[exampleIdx]}"
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">Just tell me something like this — I'll take it from there</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
            <a href={loginUrl}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                Meet your Future — it's free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <a href="#what-i-can-do">
              <Button variant="outline" size="lg" className="font-semibold text-base px-8 py-6 rounded-xl border-border bg-white hover:bg-accent">
                See what I can do
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
            {["No tech skills needed", "Free to start", "Results in minutes", "Cancel anytime"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-y border-border py-12 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl font-black text-primary mb-1">
              <AnimatedCounter target={50000} suffix="+" />
            </div>
            <div className="text-sm text-muted-foreground font-medium">People I'm helping</div>
          </div>
          <div>
            <div className="text-4xl font-black text-primary mb-1">
              <AnimatedCounter target={200000} suffix="+" />
            </div>
            <div className="text-sm text-muted-foreground font-medium">Dreams brought to life</div>
          </div>
          <div>
            <div className="text-4xl font-black text-primary mb-1">
              4.9 ★
            </div>
            <div className="text-sm text-muted-foreground font-medium">Average rating</div>
          </div>
        </div>
      </section>

      {/* ── Meet Future ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-violet-50/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-violet-100 rounded-full px-4 py-1.5 text-sm font-semibold text-violet-700 mb-5">
              <Heart className="w-3.5 h-3.5" />
              Meet Future
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-5 leading-tight">
              I'm not just a tool.<br />
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                I'm your partner in success.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Most people have incredible ideas but not enough time, money, or skills to make them real. I exist to change that. 
              Whatever you want to build, create, or launch — I'm here to make it happen for you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COMPANION_TRAITS.map((trait) => (
              <div key={trait.title} className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-center">
                <div className={`w-12 h-12 rounded-xl ${trait.color} flex items-center justify-center mx-auto mb-4`}>
                  <trait.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm mb-2">{trait.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{trait.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What I Can Do ── */}
      <section id="what-i-can-do" className="py-20 px-4 bg-gray-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              What do you want me to{" "}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">do for you?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Pick your goal. I'll handle everything — no experience, no tech skills, no problem.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASES.map((uc) => (
              <a
                key={uc.title}
                href={loginUrl}
                className={`group relative ${uc.bg} ${uc.border} border rounded-2xl p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer block`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${uc.color} flex items-center justify-center mb-4 shadow-sm`}>
                  <span className="text-2xl">{uc.emoji}</span>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-1">{uc.title}</h3>
                <p className="text-xs font-semibold text-muted-foreground mb-3">{uc.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{uc.desc}</p>

                {uc.showPlatforms && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 border border-border shadow-sm">
                      <AppleIcon />
                      <span className="text-xs font-semibold">iPhone (iOS)</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 border border-border shadow-sm">
                      <AndroidIcon />
                      <span className="text-xs font-semibold">Android</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {uc.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold bg-white border border-border rounded-full px-2.5 py-0.5 text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </a>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-muted-foreground text-sm mb-4">Don't see your goal? I can handle almost anything — just ask me.</p>
            <a href={loginUrl}>
              <Button variant="outline" className="border-border bg-white hover:bg-accent font-semibold">
                Tell me your idea <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Working with me is as easy as{" "}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">texting a friend</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              No tutorials. No setup. No learning curve. Just tell me what you need.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                num: "1",
                icon: MessageSquare,
                color: "text-violet-600 bg-violet-100",
                title: "You tell me what you want",
                desc: "Just type it in plain English. \"Build me an app for my restaurant\" or \"Write a business plan for my bakery.\" No tech skills needed — ever.",
              },
              {
                num: "2",
                icon: Zap,
                color: "text-amber-600 bg-amber-100",
                title: "I get to work immediately",
                desc: "I think, plan, write, code, and create — handling every single step automatically. You can watch me work in real time.",
              },
              {
                num: "3",
                icon: CheckCircle2,
                color: "text-emerald-600 bg-emerald-100",
                title: "You get real results",
                desc: "A finished app, a complete book, a live website, a full business plan — delivered to you, ready to use right away.",
              },
            ].map((step, i, arr) => (
              <div key={step.num} className="relative text-center">
                {i < arr.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-5 shadow-sm`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Step {step.num}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Example prompts */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-gray-50 border border-border rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Things people ask me every day:</p>
              <div className="space-y-2.5">
                {EXAMPLES.map((example) => (
                  <div key={example} className="flex items-start gap-3 bg-white rounded-xl p-3.5 border border-border hover:border-primary/30 transition-colors">
                    <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">"{example}"</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <a href={loginUrl}>
                  <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                    Tell me your idea <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-violet-50/50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Real people. Real transformations.</h2>
            <p className="text-muted-foreground text-lg">People just like you — with big ideas and no tech background.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">Start free. No surprises.</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Your first tasks are on me. No credit card required. Upgrade only when you're ready for more.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { name: "Free", price: "$0", desc: "Get started today, no card needed", highlight: false },
              { name: "Pro", price: "$29/mo", desc: "Unlimited projects for power users", highlight: true },
              { name: "Business", price: "$99/mo", desc: "For teams and growing businesses", highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-5 border text-left ${plan.highlight ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-gray-50"}`}>
                {plan.highlight && <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Most Popular</div>}
                <div className="font-bold text-sm mb-1">{plan.name}</div>
                <div className="text-2xl font-black mb-2">{plan.price}</div>
                <div className="text-xs text-muted-foreground">{plan.desc}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={loginUrl}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-10 rounded-xl shadow-lg shadow-primary/20">
                Start for free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="font-semibold px-10 rounded-xl border-border bg-white hover:bg-accent">
                See all plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <img src={LOGO_URL} alt="Future" className="h-12 w-auto mx-auto mb-6 brightness-0 invert" />
          <h2 className="text-4xl sm:text-5xl font-black mb-5 leading-tight">
            You deserve a Future<br />that works for you.
          </h2>
          <p className="text-xl text-white/80 mb-4 max-w-xl mx-auto leading-relaxed">
            I'm ready when you are. Tell me your dream — your app, your book, your business — and I'll help you make it real.
          </p>
          <p className="text-white/60 text-base mb-10 max-w-lg mx-auto">
            No experience needed. No tech skills required. Just you, your idea, and me.
          </p>
          <a href={loginUrl}>
            <Button size="lg" className="bg-white text-violet-700 hover:bg-white/90 font-bold text-base px-10 py-6 rounded-xl shadow-xl">
              Meet your Future — it's free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
          <p className="text-white/40 text-sm mt-5">No credit card • No tech skills • Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-3">
                <img src={LOGO_URL} alt="Future" className="h-7 w-auto brightness-0 invert opacity-80" />
                <span className="font-black text-lg text-white">Future</span>
              </div>
              <p className="text-sm leading-relaxed">
                Your personal AI companion. Tell me what you want — I'll do the work for you.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="font-semibold text-white mb-3">What I can do</div>
                <div className="space-y-2">
                  <a href="#what-i-can-do" className="block hover:text-white transition-colors">Build apps</a>
                  <a href="#what-i-can-do" className="block hover:text-white transition-colors">Write books</a>
                  <a href="#what-i-can-do" className="block hover:text-white transition-colors">Launch businesses</a>
                  <Link href="/gallery" className="block hover:text-white transition-colors">See gallery</Link>
                </div>
              </div>
              <div>
                <div className="font-semibold text-white mb-3">Account</div>
                <div className="space-y-2">
                  <Link href="/signin" className="block hover:text-white transition-colors">Sign in</Link>
                  <a href={getLoginUrl()} className="block hover:text-white transition-colors">Sign up free</a>
                  <Link href="/dashboard" className="block hover:text-white transition-colors">Dashboard</Link>
                  <Link href="/pricing" className="block hover:text-white transition-colors">Pricing</Link>
                </div>
              </div>
              <div>
                <div className="font-semibold text-white mb-3">Support</div>
                <div className="space-y-2">
                  <a href="mailto:support@futureos.io" className="block hover:text-white transition-colors">Contact me</a>
                  <Link href="/dashboard/billing" className="block hover:text-white transition-colors">Billing</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} Future AI. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
