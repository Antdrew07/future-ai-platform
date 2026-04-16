import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  Search, Sparkles, Bot, Globe, Code2, Brain, Zap, Star,
  ArrowRight, Users, TrendingUp, Play, Copy
} from "lucide-react";

const CATEGORIES = ["All", "Research", "Coding", "Writing", "Data", "Marketing", "Finance", "Productivity"];

const FEATURED_AGENTS = [
  { name: "Deep Research Pro", description: "Conducts exhaustive multi-source research, cross-references facts, and delivers publication-quality reports with citations.", category: "Research", icon: Globe, color: "from-blue-500/20 to-cyan-500/20", tasks: 12400, rating: 4.9, model: "Future-1 Pro" },
  { name: "Full-Stack Engineer", description: "Designs, writes, and tests complete applications. Handles frontend, backend, databases, and deployment configs.", category: "Coding", icon: Code2, color: "from-emerald-500/20 to-green-500/20", tasks: 8900, rating: 4.8, model: "Future-1 Code" },
  { name: "Market Intelligence", description: "Tracks competitors, analyzes market trends, and generates strategic intelligence reports for business decisions.", category: "Finance", icon: TrendingUp, color: "from-violet-500/20 to-purple-500/20", tasks: 6200, rating: 4.7, model: "Future-1 Pro" },
  { name: "Content Strategist", description: "Creates SEO-optimized content strategies, writes blog posts, social media copy, and email campaigns.", category: "Marketing", icon: Zap, color: "from-orange-500/20 to-amber-500/20", tasks: 15600, rating: 4.8, model: "Future-1 Code" },
  { name: "Data Science Suite", description: "Loads datasets, performs statistical analysis, builds ML models, and generates visualizations with Python.", category: "Data", icon: Brain, color: "from-pink-500/20 to-rose-500/20", tasks: 4300, rating: 4.9, model: "Future-1 Pro" },
  { name: "Executive Assistant", description: "Manages tasks, drafts emails, schedules research, and handles complex multi-step administrative workflows.", category: "Productivity", icon: Bot, color: "from-cyan-500/20 to-blue-500/20", tasks: 21000, rating: 4.6, model: "Future-1 Ultra" },
];

export default function AgentGallery() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = FEATURED_AGENTS.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || a.category === category;
    return matchSearch && matchCat;
  });

  const handleTryAgent = (agentName: string) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    navigate("/agents/new");
    toast.success(`Loading ${agentName} template...`);
  };

  return (
    <div className="min-h-screen bg-[#06060a]">
      {/* Nav */}
      <nav className="border-b border-white/[0.04] backdrop-blur-xl bg-[#06060a]/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-heading font-bold text-white text-sm">Future</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="text-xs text-white/50 hover:text-white">Pricing</Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="glow-primary text-xs h-8">Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="glow-primary text-xs h-8">Get Started</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-40 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <Badge variant="outline" className="mb-4 border-violet-500/20 text-violet-300 bg-violet-500/10 text-xs">
            <Users className="w-3 h-3 mr-1.5" />
            Community Gallery
          </Badge>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
            Discover <span className="gradient-text">AI Agents</span>
          </h1>
          <p className="text-sm text-white/40 max-w-lg mx-auto mb-8">
            Browse agents built by the Future community. Clone any agent to your workspace in one click.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents..."
                className="pl-10 h-10 bg-white/[0.03] border-white/[0.06]"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 justify-center mt-4 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant="ghost"
                size="sm"
                className={`text-xs h-7 px-3 rounded-full transition-all ${
                  category === cat
                    ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
                }`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="glass rounded-xl p-4 flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <div className="text-xl font-heading font-bold gradient-text">2,400+</div>
            <div className="text-[10px] text-white/30">Community Agents</div>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div className="text-center">
            <div className="text-xl font-heading font-bold gradient-text">10M+</div>
            <div className="text-[10px] text-white/30">Tasks Completed</div>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div className="text-center">
            <div className="text-xl font-heading font-bold gradient-text">50K+</div>
            <div className="text-[10px] text-white/30">Active Builders</div>
          </div>
          <div className="ml-auto">
            <Button size="sm" variant="outline" className="text-xs h-8 border-white/[0.06] bg-white/[0.02]"
              onClick={() => navigate(isAuthenticated ? "/agents/new" : getLoginUrl())}>
              <Sparkles className="w-3 h-3 mr-1.5" />
              Publish Your Agent
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-2 mb-5">
          <Star className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-heading font-semibold text-white">Featured Agents</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <div key={agent.name} className="glass card-hover rounded-xl p-5 group relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${agent.color} rounded-bl-3xl opacity-50`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center ring-1 ring-white/[0.06]`}>
                    <agent.icon className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{agent.rating}</span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-white text-sm">{agent.name}</h3>
                    <Badge variant="outline" className="text-[9px] border-white/[0.06] text-white/30">{agent.category}</Badge>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed line-clamp-3">{agent.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  <div className="text-[10px] text-white/30">
                    <span className="font-medium text-white/50">{agent.tasks.toLocaleString()}</span> tasks
                    <span className="mx-1.5 text-white/10">·</span>
                    <span>{agent.model}</span>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-white/[0.06] bg-white/[0.02]"
                      onClick={() => handleTryAgent(agent.name)}>
                      <Copy className="w-2.5 h-2.5 mr-1" />Clone
                    </Button>
                    <Button size="sm" className="h-6 px-2 text-[10px] glow-primary"
                      onClick={() => handleTryAgent(agent.name)}>
                      <Play className="w-2.5 h-2.5 mr-1" />Try
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-4 ring-1 ring-white/[0.06]">
              <Globe className="w-7 h-7 text-white/10" />
            </div>
            <h3 className="font-heading font-semibold text-white/60 mb-1">No agents found</h3>
            <p className="text-xs text-white/30">Try adjusting your search or filters</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center glass rounded-2xl p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-blue-500/5" />
          <div className="relative">
            <h2 className="text-2xl font-heading font-bold text-white mb-3">
              Build Your Own <span className="gradient-text">Autonomous Agent</span>
            </h2>
            <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">
              No code required. Define a prompt, pick your tools, and deploy in seconds.
            </p>
            <a href={isAuthenticated ? "/agents/new" : getLoginUrl()}>
              <Button size="lg" className="h-11 px-8 glow-primary">
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
