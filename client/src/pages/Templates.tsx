import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Search, Store, Star, Download, Bot, Zap, Plus, Sparkles, LayoutGrid, ArrowRight } from "lucide-react";

const CATEGORIES = ["All", "Research", "Coding", "Writing", "Data", "Productivity", "Support"];

const FEATURED = [
  { name: "Research Assistant", desc: "Autonomously researches any topic and produces comprehensive reports", category: "research", uses: 1240, rating: 4.9, icon: "🔬" },
  { name: "Code Reviewer", desc: "Reviews code for bugs, security issues, and best practices", category: "coding", uses: 890, rating: 4.8, icon: "💻" },
  { name: "Content Writer", desc: "Writes blog posts, social media content, and marketing copy", category: "writing", uses: 2100, rating: 4.7, icon: "✍️" },
  { name: "Data Analyst", desc: "Analyzes datasets and generates insights with visualizations", category: "data", uses: 650, rating: 4.8, icon: "📊" },
  { name: "Customer Support", desc: "Handles customer inquiries with context-aware responses", category: "support", uses: 3200, rating: 4.6, icon: "🎧" },
  { name: "Task Planner", desc: "Breaks down complex projects into actionable task lists", category: "productivity", uses: 780, rating: 4.9, icon: "📋" },
];

export default function Templates() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { data: templates, isLoading } = trpc.templates.list.useQuery({ limit: 50, offset: 0 });

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/[0.03] border-white/[0.06] h-9"
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
                    ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
                }`}
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-9 text-xs border-white/[0.06] bg-white/[0.02]"
            onClick={() => toast.info("Publish template coming soon")}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Publish
          </Button>
        </div>

        {/* Featured */}
        {filteredFeatured.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-heading font-semibold text-white">Featured Templates</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFeatured.map(t => (
                <div key={t.name} className="glass card-hover rounded-xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-3xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-2xl">{t.icon}</div>
                      <Badge variant="outline" className="text-[9px] border-amber-400/20 text-amber-400 bg-amber-400/10">
                        <Star className="w-2.5 h-2.5 mr-0.5 fill-amber-400" />
                        {t.rating}
                      </Badge>
                    </div>
                    <h4 className="font-heading font-semibold text-white text-sm mb-1">{t.name}</h4>
                    <p className="text-xs text-white/40 line-clamp-2 mb-4">{t.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-white/30">
                        <Download className="w-3 h-3" />{t.uses.toLocaleString()}
                      </span>
                      <Button size="sm" className="h-7 text-xs glow-primary opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => toast.success(`"${t.name}" template deployed!`)}>
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
            <LayoutGrid className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-heading font-semibold text-white">Community Templates</h3>
            <span className="text-xs text-white/30">({filteredDb.length})</span>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="glass rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-white/[0.05] rounded w-2/3 mb-3" />
                  <div className="h-3 bg-white/[0.03] rounded w-full mb-2" />
                  <div className="h-3 bg-white/[0.03] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredDb.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDb.map(t => (
                <div key={t.id} className="glass card-hover rounded-xl p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.03] flex items-center justify-center ring-1 ring-white/[0.06]">
                      <Bot className="w-4 h-4 text-white/30" />
                    </div>
                    {t.category && (
                      <Badge variant="outline" className="text-[9px] border-white/[0.06] text-white/30">{t.category}</Badge>
                    )}
                  </div>
                  <h4 className="font-heading font-medium text-white text-sm mb-1">{t.name}</h4>
                  <p className="text-xs text-white/40 line-clamp-2 mb-4">{t.description ?? "No description"}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-white/30">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {t.rating?.toFixed(1) ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {(t as { usageCount?: number }).usageCount ?? 0}
                      </span>
                    </div>
                    {t.priceCredits > 0 ? (
                      <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/20 bg-amber-400/10">
                        <Zap className="w-2.5 h-2.5 mr-1" />{t.priceCredits}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-400/20 bg-emerald-400/10">Free</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-4 ring-1 ring-white/[0.06]">
                <Store className="w-7 h-7 text-white/10" />
              </div>
              <h3 className="font-heading font-semibold text-white/60 mb-1">No templates found</h3>
              <p className="text-xs text-white/30">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
