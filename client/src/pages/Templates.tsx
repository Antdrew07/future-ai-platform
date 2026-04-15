import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Search, Store, Star, Download, Bot, Zap, Plus } from "lucide-react";

export default function Templates() {
  const [search, setSearch] = useState("");
  const { data: templates, isLoading } = trpc.templates.list.useQuery({ limit: 50, offset: 0 });

  const filtered = templates?.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const CATEGORY_COLORS: Record<string, string> = {
    productivity: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    research: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    coding: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    writing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    data: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    customer_support: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <FutureDashboardLayout title="Templates" subtitle="Discover and deploy pre-built agent templates">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card/50"
            />
          </div>
          <Button variant="outline" onClick={() => toast.info("Publish template coming soon")}>
            <Plus className="w-4 h-4 mr-2" />
            Publish Template
          </Button>
        </div>

        {/* Featured */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Research Assistant", desc: "Autonomously researches any topic and produces comprehensive reports", category: "research", uses: 1240, rating: 4.9, icon: "🔬" },
            { name: "Code Reviewer", desc: "Reviews code for bugs, security issues, and best practices", category: "coding", uses: 890, rating: 4.8, icon: "💻" },
            { name: "Content Writer", desc: "Writes blog posts, social media content, and marketing copy", category: "writing", uses: 2100, rating: 4.7, icon: "✍️" },
            { name: "Data Analyst", desc: "Analyzes datasets and generates insights with visualizations", category: "data", uses: 650, rating: 4.8, icon: "📊" },
            { name: "Customer Support", desc: "Handles customer inquiries with context-aware responses", category: "customer_support", uses: 3200, rating: 4.6, icon: "🎧" },
            { name: "Task Planner", desc: "Breaks down complex projects into actionable task lists", category: "productivity", uses: 780, rating: 4.9, icon: "📋" },
          ].filter(t =>
            !search ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.desc.toLowerCase().includes(search.toLowerCase())
          ).map((template) => (
            <Card key={template.name} className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{template.icon}</div>
                  <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[template.category] ?? ""}`}>
                    {template.category.replace("_", " ")}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{template.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {template.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {template.uses.toLocaleString()}
                    </span>
                  </div>
                  <Button size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => toast.success(`"${template.name}" template deployed!`)}>
                    <Zap className="w-3 h-3 mr-1" />
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* From DB */}
        {!isLoading && filtered.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Community Templates</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((template) => (
                <Card key={template.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      {template.category && (
                        <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[template.category] ?? ""}`}>
                          {template.category}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {template.rating?.toFixed(1) ?? "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {(template as { usageCount?: number }).usageCount ?? 0}
                        </span>
                      </div>
                      {template.priceCredits > 0 ? (
                        <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-500/20 bg-yellow-500/10">
                          <Zap className="w-2.5 h-2.5 mr-1" />{template.priceCredits}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20 bg-emerald-500/10">Free</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isLoading && filtered.length === 0 && search && (
          <div className="text-center py-12 text-muted-foreground">
            <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <div className="text-sm">No templates match "{search}"</div>
          </div>
        )}
      </div>
    </FutureDashboardLayout>
  );
}
