import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  Search, Sparkles, Bot, Globe, Code2, Brain, Zap, Star,
  ArrowRight, Users, TrendingUp, Play, Copy
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029617589/m5GbkNTBEjcM6aS7UZa8ie/future-logo_dd9d650b.png";

const CATEGORIES = ["All", "Research", "Coding", "Writing", "Data", "Marketing", "Finance", "Productivity"];

const FEATURED_AGENTS = [
  { name: "Deep Research Pro", description: "Conducts exhaustive multi-source research, cross-references facts, and delivers publication-quality reports with citations.", category: "Research", icon: Globe, bgColor: "bg-blue-50", iconColor: "text-blue-600", tasks: 12400, rating: 4.9, model: "Future-1 Pro" },
  { name: "Full-Stack Engineer", description: "Designs, writes, and tests complete applications. Handles frontend, backend, databases, and deployment configs.", category: "Coding", icon: Code2, bgColor: "bg-emerald-50", iconColor: "text-emerald-600", tasks: 8900, rating: 4.8, model: "Future-1 Code" },
  { name: "Market Intelligence", description: "Tracks competitors, analyzes market trends, and generates strategic intelligence reports for business decisions.", category: "Finance", icon: TrendingUp, bgColor: "bg-violet-50", iconColor: "text-violet-600", tasks: 6200, rating: 4.7, model: "Future-1 Pro" },
  { name: "Content Strategist", description: "Creates SEO-optimized content strategies, writes blog posts, social media copy, and email campaigns.", category: "Marketing", icon: Zap, bgColor: "bg-orange-50", iconColor: "text-orange-600", tasks: 15600, rating: 4.8, model: "Future-1 Code" },
  { name: "Data Science Suite", description: "Loads datasets, performs statistical analysis, builds ML models, and generates visualizations with Python.", category: "Data", icon: Brain, bgColor: "bg-pink-50", iconColor: "text-pink-600", tasks: 4300, rating: 4.9, model: "Future-1 Pro" },
  { name: "Executive Assistant", description: "Manages tasks, drafts emails, schedules research, and handles complex multi-step administrative workflows.", category: "Productivity", icon: Bot, bgColor: "bg-cyan-50", iconColor: "text-cyan-600", tasks: 21000, rating: 4.6, model: "Future-1 Ultra" },
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
    navigate("/dashboard/agents/new");
    toast.success(`Loading ${agentName} template...`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={LOGO_URL} alt="Future" className="w-7 h-7 object-contain" />
              <span className="font-heading font-bold text-foreground text-sm">Future</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">Pricing</Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground">Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground">Get Started</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5 text-xs">
            <Users className="w-3 h-3 mr-1.5" />
            Community Gallery
          </Badge>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Discover <span className="gradient-text">AI Agents</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8">
            Browse agents built by the Future community. Clone any agent to your workspace in one click.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents..."
                className="pl-10 h-10 bg-white border-border text-foreground placeholder:text-muted-foreground"
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
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <div className="text-xl font-heading font-bold gradient-text">2,400+</div>
            <div className="text-[10px] text-muted-foreground">Community Agents</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-xl font-heading font-bold gradient-text">10M+</div>
            <div className="text-[10px] text-muted-foreground">Tasks Completed</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-xl font-heading font-bold gradient-text">50K+</div>
            <div className="text-[10px] text-muted-foreground">Active Builders</div>
          </div>
          <div className="ml-auto">
            <Button size="sm" variant="outline" className="text-xs h-8 border-border bg-white text-foreground hover:bg-accent"
              onClick={() => navigate(isAuthenticated ? "/dashboard/agents/new" : getLoginUrl())}>
              <Sparkles className="w-3 h-3 mr-1.5" />
              Publish Your Agent
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-2 mb-5">
          <Star className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-heading font-semibold text-foreground">Featured Agents</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <div key={agent.name} className="bg-white border border-border rounded-xl p-5 group relative overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${agent.bgColor} flex items-center justify-center border border-border`}>
                    <agent.icon className={`w-5 h-5 ${agent.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{agent.rating}</span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-foreground text-sm">{agent.name}</h3>
                    <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">{agent.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{agent.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">{agent.tasks.toLocaleString()}</span> tasks
                  </div>
                  <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-border bg-white text-foreground hover:bg-accent"
                      onClick={() => handleTryAgent(agent.name)}>
                      <Copy className="w-2.5 h-2.5 mr-1" />Clone
                    </Button>
                    <Button size="sm" className="h-6 px-2 text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground"
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
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 border border-border">
              <Globe className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-foreground mb-1">No agents found</h3>
            <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary/5 via-background to-primary/5 border border-primary/20 rounded-2xl p-10 relative overflow-hidden">
          <div className="relative">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-3">
              Build Your Own <span className="gradient-text">Autonomous Agent</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              No code required. Define a prompt, pick your tools, and deploy in seconds.
            </p>
            <a href={isAuthenticated ? "/dashboard/agents/new" : getLoginUrl()}>
              <Button size="lg" className="h-11 px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
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
