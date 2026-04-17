import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Store, Star, Download, Bot, Zap, Plus, Sparkles, LayoutGrid, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const CATEGORIES = ["All", "Research", "Coding", "Writing", "Data", "Productivity", "Support"];

const FEATURED = [
  { name: "Research Assistant", desc: "Autonomously researches any topic and produces comprehensive reports with citations.", category: "research", uses: 1240, rating: 4.9, icon: "🔬" },
  { name: "Code Reviewer", desc: "Reviews code for bugs, security issues, and best practices with detailed feedback.", category: "coding", uses: 890, rating: 4.8, icon: "💻" },
  { name: "Content Writer", desc: "Writes blog posts, social media content, and marketing copy tailored to your brand.", category: "writing", uses: 2100, rating: 4.7, icon: "✍️" },
  { name: "Data Analyst", desc: "Analyzes datasets and generates insights with visualizations and recommendations.", category: "data", uses: 650, rating: 4.8, icon: "📊" },
  { name: "Customer Support", desc: "Handles customer inquiries with context-aware, empathetic responses.", category: "support", uses: 3200, rating: 4.6, icon: "🎧" },
  { name: "Task Planner", desc: "Breaks down complex projects into actionable task lists with timelines.", category: "productivity", uses: 780, rating: 4.9, icon: "📋" },
];

export default function Templates() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: templates, isLoading } = trpc.templates.list.useQuery({ limit: 50, offset: 0 });

  const installMutation = trpc.templates.install.useMutation({
    onSuccess: (data) => {
      toast.success("Template installed! Redirecting to your new agent...");
      utils.agents.list.invalidate();
      setTimeout(() => navigate(`/dashboard/agents`), 1200);
      setInstallingSlug(null);
    },
    onError: (e) => {
      toast.error(e.message);
      setInstallingSlug(null);
    },
  });

  const handleInstall = (slug: string) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    setInstallingSlug(slug);
    installMutation.mutate({ templateSlug: slug });
  };

  const handleFeaturedUse = (templateName: string) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    // For featured (static) templates, navigate to agent builder with pre-filled name
    navigate(`/dashboard/agents/new?template=${encodeURIComponent(templateName)}`);
    toast.success(`Opening "${templateName}" template in agent builder...`);
  };

  const filteredFeatured = FEATURED.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || t.category === category.toLowerCase();
    return matchSearch && matchCat;
  });

  const filteredDb = (templates ?? []).filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <FutureDashboardLayout title="Templates" subtitle="Discover and deploy pre-built agent templates">
      <div className="p-6 space-y-8">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background border-border text-foreground h-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(c => (
              <Button
                key={c}
                variant="ghost"
                size="sm"
                className={`text-xs h-7 px-3 rounded-full transition-all ${
                  category === c
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-9 text-xs border-border bg-white text-foreground hover:bg-accent"
            onClick={() => {
              if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
              navigate("/dashboard/agents/new");
              toast.info("Create an agent first, then publish it as a template from the agent settings.");
            }}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Publish Template
          </Button>
        </div>

        {/* Featured */}
        {filteredFeatured.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-heading font-semibold text-foreground">Featured Templates</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFeatured.map(t => (
                <div key={t.name} className="bg-white border border-border rounded-xl p-5 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-3xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-2xl">{t.icon}</div>
                      <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-600 bg-amber-50">
                        <Star className="w-2.5 h-2.5 mr-0.5 fill-amber-400" />
                        {t.rating}
                      </Badge>
                    </div>
                    <h4 className="font-heading font-semibold text-foreground text-sm mb-1">{t.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{t.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Download className="w-3 h-3" />{t.uses.toLocaleString()} uses
                      </span>
                      <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => handleFeaturedUse(t.name)}>
                        Use Template
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-heading font-semibold text-foreground">Community Templates</h3>
            <span className="text-xs text-muted-foreground">({filteredDb.length})</span>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-muted border border-border rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-muted-foreground/10 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-full mb-2" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredDb.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDb.map(t => (
                <div key={t.id} className="bg-white border border-border rounded-xl p-5 group shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {t.category && (
                      <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">{t.category}</Badge>
                    )}
                  </div>
                  <h4 className="font-heading font-medium text-foreground text-sm mb-1">{t.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{t.description ?? "No description"}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {t.rating?.toFixed(1) ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {(t as { usageCount?: number }).usageCount ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.priceCredits > 0 ? (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                          <Zap className="w-2.5 h-2.5 mr-1" />{t.priceCredits} cr
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">Free</Badge>
                      )}
                      <Button
                        size="sm"
                        className="h-6 text-[10px] px-2 bg-primary hover:bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 transition-all"
                        disabled={installingSlug === t.slug}
                        onClick={() => handleInstall(t.slug)}
                      >
                        {installingSlug === t.slug ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>Use<ArrowRight className="w-2.5 h-2.5 ml-1" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
                <Store className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1">No templates found</h3>
              <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
