/**
 * Future AI Platform — Agent Gallery
 * 
 * Public gallery of community-built agents that users can discover,
 * preview, and clone into their own workspace.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  Search, Sparkles, Bot, Globe, Code2, Brain, Zap, Star,
  ArrowRight, Users, TrendingUp, Filter, Play, Copy
} from "lucide-react";
import { Link } from "wouter";

const CATEGORIES = ["All", "Research", "Coding", "Writing", "Data", "Marketing", "Finance", "Productivity"];

const FEATURED_AGENTS = [
  {
    name: "Deep Research Pro",
    description: "Conducts exhaustive multi-source research, cross-references facts, and delivers publication-quality reports with citations.",
    category: "Research",
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    tasks: 12400,
    rating: 4.9,
    model: "Future-1 Pro",
  },
  {
    name: "Full-Stack Engineer",
    description: "Designs, writes, and tests complete applications. Handles frontend, backend, databases, and deployment configs.",
    category: "Coding",
    icon: Code2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    tasks: 8900,
    rating: 4.8,
    model: "Future-1 Code",
  },
  {
    name: "Market Intelligence",
    description: "Tracks competitors, analyzes market trends, and generates strategic intelligence reports for business decisions.",
    category: "Finance",
    icon: TrendingUp,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    tasks: 6200,
    rating: 4.7,
    model: "Future-1 Pro",
  },
  {
    name: "Content Strategist",
    description: "Creates SEO-optimized content strategies, writes blog posts, social media copy, and email campaigns.",
    category: "Marketing",
    icon: Zap,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    tasks: 15600,
    rating: 4.8,
    model: "Future-1 Code",
  },
  {
    name: "Data Science Suite",
    description: "Loads datasets, performs statistical analysis, builds ML models, and generates visualizations with Python.",
    category: "Data",
    icon: Brain,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    tasks: 4300,
    rating: 4.9,
    model: "Future-1 Pro",
  },
  {
    name: "Executive Assistant",
    description: "Manages tasks, drafts emails, schedules research, and handles complex multi-step administrative workflows.",
    category: "Productivity",
    icon: Bot,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    tasks: 21000,
    rating: 4.6,
    model: "Future-1 Ultra",
  },
];

export default function AgentGallery() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: templates } = trpc.templates.list.useQuery({ limit: 20 });

  const filtered = FEATURED_AGENTS.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || a.category === category;
    return matchSearch && matchCat;
  });

  const handleTryAgent = (agentName: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    navigate("/agents/new");
    toast.success(`Loading ${agentName} template...`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Future</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="glow-primary">Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="glow-primary">Get Started Free</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <Badge variant="secondary" className="border border-primary/30 bg-primary/10 text-primary px-4 py-1.5">
              <Users className="w-3 h-3 mr-1.5" />
              Community Gallery
            </Badge>
            <h1 className="text-5xl font-black tracking-tight">
              Discover <span className="gradient-text">AI Agents</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Browse agents built by the Future community. Clone any agent to your workspace in one click.
            </p>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents..."
                className="pl-9 bg-card/50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className="whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mb-8 p-4 rounded-xl border border-border/50 bg-card/30">
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">2,400+</div>
              <div className="text-xs text-muted-foreground">Community Agents</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">10M+</div>
              <div className="text-xs text-muted-foreground">Tasks Completed</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">50K+</div>
              <div className="text-xs text-muted-foreground">Active Builders</div>
            </div>
            <div className="ml-auto">
              <Button size="sm" variant="outline" onClick={() => navigate(isAuthenticated ? "/agents/new" : getLoginUrl())}>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Publish Your Agent
              </Button>
            </div>
          </div>

          {/* Featured Grid */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Featured Agents
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((agent) => (
                <div
                  key={agent.name}
                  className="group p-5 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${agent.bg} flex items-center justify-center`}>
                      <agent.icon className={`w-5 h-5 ${agent.color}`} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span>{agent.rating}</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">{agent.name}</h3>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{agent.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {agent.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{agent.tasks.toLocaleString()}</span> tasks
                      <span className="mx-1.5">·</span>
                      <span>{agent.model}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleTryAgent(agent.name)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Clone
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleTryAgent(agent.name)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Try
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center p-10 rounded-2xl border border-primary/20 bg-primary/5">
            <h2 className="text-3xl font-bold mb-3">
              Build Your Own <span className="gradient-text">Autonomous Agent</span>
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              No code required. Define a prompt, pick your tools, and deploy in seconds.
            </p>
            <a href={isAuthenticated ? "/agents/new" : getLoginUrl()}>
              <Button size="lg" className="h-12 px-8 glow-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Building Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
