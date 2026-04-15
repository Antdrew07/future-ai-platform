import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "wouter";
import {
  Users, Bot, Zap, TrendingUp, Shield, Activity, DollarSign,
  Search, ChevronRight, AlertCircle
} from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: users } = trpc.admin.users.useQuery({ limit: 50, offset: 0 });

  const addCreditsMutation = trpc.credits.addBonus.useMutation({
    onSuccess: () => toast.success("Credits added"),
    onError: (e) => toast.error(e.message),
  });

  if (user?.role !== "admin") {
    return (
      <FutureDashboardLayout title="Admin Panel" subtitle="Restricted access">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-12 h-12 text-destructive/50" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You need admin privileges to access this page.</p>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </FutureDashboardLayout>
    );
  }

  const filteredUsers = users?.filter(u =>
    !search ||
    (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const statCards = [
    { title: "Total Users", value: stats?.userCount ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { title: "Total Agents", value: stats?.agentCount ?? 0, icon: Bot, color: "text-violet-400", bg: "bg-violet-500/10" },
    { title: "Total Tasks", value: stats?.taskCount ?? 0, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { title: "Credits Purchased", value: (stats?.totalCreditsPurchased ?? 0).toLocaleString(), icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { title: "Credits Issued", value: (stats?.totalCreditsPurchased ?? 0).toLocaleString(), icon: Zap, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { title: "Platform Health", value: "Good", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <FutureDashboardLayout title="Admin Panel" subtitle="System management and oversight">
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card) => (
            <Card key={card.title} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="text-xl font-bold">{card.value}</div>
                <div className="text-[10px] text-muted-foreground">{card.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                User Management
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted/30"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Credits</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-xs">{u.name ?? "—"}</div>
                            <div className="text-[10px] text-muted-foreground">{u.email ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[10px] ${u.role === "admin" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-muted-foreground"}`}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-mono">
                        {(u.creditBalance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                          onClick={() => {
                            const amount = prompt("Credits to add:");
                            if (amount && !isNaN(Number(amount))) {
                              addCreditsMutation.mutate({
                                userId: u.id,
                                amount: Number(amount),
                                description: "Admin bonus",
                              });
                            }
                          }}>
                          <Zap className="w-3 h-3 mr-1" />
                          Add Credits
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No users found</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Model Pricing */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              Model Credit Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Model</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Input Credits/1K</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Output Credits/1K</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tier</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "future-agent-1", name: "Future-1 Ultra", inputPer1k: 1, outputPer1k: 2, tier: "ultra" },
                  { id: "gpt-4o", name: "Future-1 Pro", inputPer1k: 5, outputPer1k: 15, tier: "premium" },
                  { id: "claude-3-5-sonnet-20241022", name: "Future-1 Code", inputPer1k: 8, outputPer1k: 24, tier: "premium" },
                  { id: "gpt-4o-mini", name: "Future-1 Mini", inputPer1k: 0.15, outputPer1k: 0.6, tier: "standard" },
                  { id: "claude-3-haiku-20240307", name: "Future-1 Fast", inputPer1k: 0.8, outputPer1k: 4, tier: "standard" },
                ].map((m) => (
                  <tr key={m.id} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-xs">{m.name}</td>
                    <td className="px-4 py-3 text-right text-xs font-mono">{m.inputPer1k}</td>
                    <td className="px-4 py-3 text-right text-xs font-mono">{m.outputPer1k}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className={`text-[10px] ${
                        m.tier === "premium" ? "text-violet-400 border-violet-500/20 bg-violet-500/10" :
                        m.tier === "ultra" ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" :
                        "text-blue-400 border-blue-500/20 bg-blue-500/10"
                      }`}>{m.tier}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </FutureDashboardLayout>
  );
}
