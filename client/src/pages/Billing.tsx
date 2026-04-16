import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Zap, CreditCard, TrendingUp, CheckCircle2, Clock, ArrowUpRight, ExternalLink } from "lucide-react";

export default function Billing() {
  const { data: balance } = trpc.credits.balance.useQuery();
  const { data: transactions } = trpc.credits.transactions.useQuery({ limit: 20 });
  const { data: packs } = trpc.credits.packs.useQuery();
  const { data: _plans } = trpc.credits.plans.useQuery();

  const checkoutMutation = trpc.credits.checkout.useMutation({
    onSuccess: (data) => { window.open(data.url, "_blank"); },
    onError: (e) => toast.error(e.message),
  });

  const handleBuyCredits = (pack: { credits: number; priceUsd: number; name?: string }) => {
    toast.info("Opening secure checkout...");
    checkoutMutation.mutate({
      credits: pack.credits,
      priceUsd: pack.priceUsd,
      packName: pack.name ?? `${pack.credits.toLocaleString()} Credits`,
      origin: window.location.origin,
    });
  };

  const PLAN_COLORS: Record<string, string> = {
    free: "border-border/50",
    pro: "border-primary/50 bg-primary/5",
    business: "border-violet-500/30 bg-violet-500/5",
    enterprise: "border-yellow-500/30 bg-yellow-500/5",
  };

  return (
    <FutureDashboardLayout title="Billing" subtitle="Manage your credits and subscription">
      <div className="p-6 space-y-6">
        {/* Balance Card */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-5 md:col-span-1 border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Credit Balance</span>
              </div>
              <div className="text-4xl font-black gradient-text mb-1">
                {(balance ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Available credits</div>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">This Month</span>
              </div>
              <div className="text-2xl font-bold">
                {transactions?.filter(t => t.type === "usage").reduce((a, t) => a + Math.abs(t.amount), 0).toLocaleString() ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Credits used</div>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium">Total Purchased</span>
              </div>
              <div className="text-2xl font-bold">
                {transactions?.filter(t => t.type === "purchase").reduce((a, t) => a + t.amount, 0).toLocaleString() ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">All time</div>
            </div>
          </div>
        </div>

        {/* Credit Packs */}
        <div>
          <h2 className="text-base font-semibold mb-4">Buy Credits</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packs && packs.length > 0 ? packs.map((pack) => (
              <div key={pack.id} className={`glass card-hover rounded-xl p-4 ${pack.isPopular ? "border-primary/30 ring-1 ring-primary/20" : ""}`}>
                  {pack.isPopular && (
                    <Badge className="mb-2 text-[10px] bg-primary/20 text-primary border-0">Popular</Badge>
                  )}
                  <div className="text-xl font-bold mb-0.5">{pack.credits.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mb-3">credits</div>
                  <div className="text-2xl font-black mb-4">${pack.priceUsd}</div>
                  <Button className={`w-full h-8 text-xs ${pack.isPopular ? "glow-primary" : ""}`} variant={pack.isPopular ? "default" : "outline"}
                    onClick={() => handleBuyCredits({ credits: pack.credits, priceUsd: pack.priceUsd, name: pack.name })}>
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    Buy Now
                  </Button>
              </div>
            )) : (
              // Default packs if none in DB
              [
                { id: 1, credits: 10000, priceUsd: 5, isPopular: false },
                { id: 2, credits: 50000, priceUsd: 20, isPopular: true },
                { id: 3, credits: 150000, priceUsd: 50, isPopular: false },
                { id: 4, credits: 500000, priceUsd: 150, isPopular: false },
              ].map((pack) => (
                <div key={pack.id} className={`glass card-hover rounded-xl p-4 ${pack.isPopular ? "border-primary/30 ring-1 ring-primary/20" : ""}`}>
                    {pack.isPopular && (
                      <Badge className="mb-2 text-[10px] bg-primary/20 text-primary border-0">Popular</Badge>
                    )}
                    <div className="text-xl font-bold mb-0.5">{pack.credits.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mb-3">credits</div>
                    <div className="text-2xl font-black mb-4">${pack.priceUsd}</div>
                    <Button className={`w-full h-8 text-xs ${pack.isPopular ? "glow-primary" : ""}`} variant={pack.isPopular ? "default" : "outline"}
                      onClick={() => handleBuyCredits({ credits: pack.credits, priceUsd: pack.priceUsd })}>
                      <ExternalLink className="w-3 h-3 mr-1.5" />
                      Buy Now
                    </Button>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Payments processed securely via{" "}
            <a href="https://payloglobal.com" target="_blank" className="text-primary hover:underline">Payloglobal</a>.
            Credits never expire.
          </p>
        </div>

        {/* Model Pricing */}
        <div>
          <h2 className="text-base font-semibold mb-4">Credit Costs Per Model</h2>
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Model</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Input (per 1K tokens)</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Output (per 1K tokens)</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Future-1 Ultra", model: "future-agent-1", input: 1, output: 2, tier: "ultra" },
                    { name: "Future-1 Pro", model: "gpt-4o", input: 5, output: 15, tier: "premium" },
                    { name: "Future-1 Code", model: "claude-3-5-sonnet-20241022", input: 8, output: 24, tier: "premium" },
                    { name: "Future-1 Mini", model: "gpt-4o-mini", input: 0.15, output: 0.6, tier: "standard" },
                    { name: "Future-1 Fast", model: "claude-3-haiku-20240307", input: 0.8, output: 4, tier: "standard" },
                  ].map((m) => (
                    <tr key={m.model} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{m.input} cr</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{m.output} cr</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className={`text-[10px] ${
                          m.tier === "premium" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                          m.tier === "ultra" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>{m.tier}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-base font-semibold mb-4">Transaction History</h2>
          <div className="glass rounded-xl overflow-hidden">
            {transactions && transactions.length > 0 ? (
              <div className="divide-y divide-border/30">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.type === "purchase" ? "bg-emerald-500/10" :
                      tx.type === "usage" ? "bg-destructive/10" :
                      "bg-muted"
                    }`}>
                      {tx.type === "purchase" ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> :
                       tx.type === "usage" ? <Zap className="w-4 h-4 text-destructive" /> :
                       <Clock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                    <div className={`text-sm font-semibold ${tx.amount > 0 ? "text-emerald-400" : "text-destructive"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{tx.balanceAfter.toLocaleString()} cr</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
