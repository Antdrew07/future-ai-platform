import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import {
  Users, Cpu, Coins, Activity, Shield, Search,
  Crown, Sparkles, Zap, TrendingUp, DollarSign
} from "lucide-react";

const MODEL_TIERS: Record<string, { label: string; color: string }> = {
  ultra: { label: "Ultra", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  premium: { label: "Premium", color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
  standard: { label: "Standard", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
};

const MODELS = [
  { name: "Future-1 Ultra", tier: "ultra", input: 10, output: 30, icon: Crown },
  { name: "Future-1 Pro", tier: "premium", input: 8, output: 24, icon: Sparkles },
  { name: "Future-1 Code", tier: "premium", input: 6, output: 18, icon: Cpu },
  { name: "Future-1 Mini", tier: "standard", input: 2, output: 6, icon: Zap },
  { name: "Future-1 Fast", tier: "standard", input: 1, output: 4, icon: Activity },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: stats } = trpc.admin.stats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: users } = trpc.admin.users.useQuery(
    { limit: 100, offset: 0 },
    { enabled: user?.role === "admin" }
  );
  const addCreditsMutation = trpc.credits.addBonus.useMutation({
    onSuccess: () => toast.success("Credits added successfully"),
    onError: (e) => toast.error(e.message),
  });

  if (user?.role !== "admin") {
    return (
      <FutureDashboardLayout title="Admin" subtitle="System administration">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Shield className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-sm">Access restricted to administrators</p>
          </div>
        </div>
      </FutureDashboardLayout>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.userCount ?? 0, icon: Users, color: "from-violet-500/20 to-violet-600/5" },
    { label: "Total Agents", value: stats?.agentCount ?? 0, icon: Cpu, color: "from-blue-500/20 to-blue-600/5" },
    { label: "Total Tasks", value: stats?.taskCount ?? 0, icon: Activity, color: "from-emerald-500/20 to-emerald-600/5" },
    { label: "Credits Purchased", value: (stats?.totalCreditsPurchased ?? 0).toLocaleString(), icon: DollarSign, color: "from-amber-500/20 to-amber-600/5" },
    { label: "Credits Issued", value: (stats?.totalCreditsPurchased ?? 0).toLocaleString(), icon: Coins, color: "from-cyan-500/20 to-cyan-600/5" },
    { label: "Platform Health", value: "Good", icon: TrendingUp, color: "from-rose-500/20 to-rose-600/5" },
  ];

  const filteredUsers = (users ?? []).filter(
    (u) =>
      !search ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <FutureDashboardLayout title="Admin Panel" subtitle="System administration & analytics">
      <div className="p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="glass rounded-xl p-4 relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-50`} />
              <div className="relative">
                <s.icon className="w-4 h-4 text-white/30 mb-2" />
                <div className="text-xl font-heading font-bold text-white">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Users Management */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 pt-5 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                User Management
              </h3>
              <p className="text-xs text-white/40 mt-0.5">{(users ?? []).length} registered users</p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs bg-white/[0.03] border-white/[0.06]"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-t border-white/[0.04]">
                  <th className="text-left px-5 py-2.5 text-white/30 font-medium">User</th>
                  <th className="text-left px-5 py-2.5 text-white/30 font-medium">Role</th>
                  <th className="text-right px-5 py-2.5 text-white/30 font-medium">Credits</th>
                  <th className="text-right px-5 py-2.5 text-white/30 font-medium">Joined</th>
                  <th className="text-right px-5 py-2.5 text-white/30 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold text-white/60 ring-1 ring-white/[0.06]">
                          {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white/80">{u.name ?? "—"}</div>
                          <div className="text-white/30">{u.email ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={`text-[10px] ${u.role === "admin" ? "border-amber-400/30 text-amber-400" : "border-white/10 text-white/40"}`}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white/60">
                      {(u.creditBalance ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-white/30">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-white/40 hover:text-white"
                        onClick={() => {
                          const amount = prompt("Credits to add:");
                          if (amount && !isNaN(Number(amount))) {
                            addCreditsMutation.mutate({
                              userId: u.id,
                              amount: Number(amount),
                              description: "Admin bonus",
                            });
                          }
                        }}
                      >
                        <Coins className="w-3 h-3 mr-1" />
                        Add Credits
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-white/30 text-sm">No users found</div>
            )}
          </div>
        </div>

        {/* Model Pricing */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <h3 className="text-sm font-heading font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Model Credit Pricing
            </h3>
            <p className="text-xs text-white/40 mt-0.5">Credits per 1,000 tokens</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-t border-white/[0.04]">
                  <th className="text-left px-5 py-2.5 text-white/30 font-medium">Model</th>
                  <th className="text-left px-5 py-2.5 text-white/30 font-medium">Tier</th>
                  <th className="text-right px-5 py-2.5 text-white/30 font-medium">Input Cost</th>
                  <th className="text-right px-5 py-2.5 text-white/30 font-medium">Output Cost</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m) => {
                  const tier = MODEL_TIERS[m.tier] ?? MODEL_TIERS.standard;
                  return (
                    <tr key={m.name} className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-white/[0.03] flex items-center justify-center ring-1 ring-white/[0.06]">
                            <m.icon className="w-3 h-3 text-white/40" />
                          </div>
                          <span className="font-medium text-white/80">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={`text-[10px] border ${tier.color}`}>
                          {tier.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-white/60">{m.input} credits</td>
                      <td className="px-5 py-3 text-right font-mono text-white/60">{m.output} credits</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
