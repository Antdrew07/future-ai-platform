import { useEffect } from "react";
import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Zap, CreditCard, TrendingUp, Clock, ArrowUpRight, ExternalLink } from "lucide-react";

export default function Billing() {
  const { data: balance, refetch: refetchBalance } = trpc.credits.balance.useQuery();
  const { data: transactions, refetch: refetchTx } = trpc.credits.transactions.useQuery({ limit: 20 });
  const { data: packs } = trpc.credits.packs.useQuery();

  // Handle Stripe redirect success/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      toast.success("Payment successful! Your credits have been added.", { duration: 6000 });
      refetchBalance();
      refetchTx();
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("cancelled") === "1") {
      toast.info("Payment cancelled. No charges were made.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refetchBalance, refetchTx]);

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

  const DEFAULT_PACKS = [
    { id: 1, credits: 10000, priceUsd: 5, isPopular: false, name: "Starter Pack" },
    { id: 2, credits: 50000, priceUsd: 20, isPopular: true, name: "Growth Pack" },
    { id: 3, credits: 150000, priceUsd: 50, isPopular: false, name: "Pro Pack" },
    { id: 4, credits: 500000, priceUsd: 150, isPopular: false, name: "Enterprise Pack" },
  ];

  const displayPacks = (packs && packs.length > 0) ? packs : DEFAULT_PACKS;

  return (
    <FutureDashboardLayout title="Billing" subtitle="Manage your credits and subscription">
      <div className="p-6 space-y-6">
        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border border-primary/20 rounded-xl shadow-sm p-5 md:col-span-1 relative overflow-hidden">
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

          <div className="bg-white border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <div className="text-2xl font-bold">
              {transactions?.filter(t => t.type === "usage").reduce((a, t) => a + Math.abs(t.amount), 0).toLocaleString() ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Credits used</div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-medium">Total Purchased</span>
            </div>
            <div className="text-2xl font-bold">
              {transactions?.filter(t => t.type === "purchase").reduce((a, t) => a + t.amount, 0).toLocaleString() ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">All time</div>
          </div>
        </div>

        {/* Credit Packs */}
        <div>
          <h2 className="text-base font-semibold mb-4">Buy Credits</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayPacks.map((pack) => (
              <div key={pack.id} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all ${pack.isPopular ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
                {pack.isPopular && (
                  <Badge className="mb-3 text-[10px] bg-primary text-primary-foreground border-0">Most Popular</Badge>
                )}
                <div className="text-2xl font-bold mb-0.5">{pack.credits.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mb-3">credits</div>
                <div className="text-3xl font-black text-foreground mb-4">${pack.priceUsd}</div>
                <Button
                  className={`w-full h-9 text-xs ${pack.isPopular ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
                  variant={pack.isPopular ? "default" : "outline"}
                  disabled={checkoutMutation.isPending}
                  onClick={() => handleBuyCredits({ credits: pack.credits, priceUsd: pack.priceUsd, name: (pack as { name?: string }).name })}
                >
                  <ExternalLink className="w-3 h-3 mr-1.5" />
                  Buy Now
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Payments processed securely via{" "}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe</a>.
            Credits never expire. Use test card <span className="font-mono">4242 4242 4242 4242</span> in sandbox mode.
          </p>
        </div>

        {/* Model Pricing */}
        <div>
          <h2 className="text-base font-semibold mb-4">Credit Costs Per Model</h2>
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Model</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Input (per 1K tokens)</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Output (per 1K tokens)</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tier</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Future-1 Ultra", input: 1, output: 2, tier: "ultra" },
                  { name: "Future-1 Pro", input: 5, output: 15, tier: "premium" },
                  { name: "Future-1 Code", input: 8, output: 24, tier: "premium" },
                  { name: "Future-1 Mini", input: 0.15, output: 0.6, tier: "standard" },
                  { name: "Future-1 Fast", input: 0.8, output: 4, tier: "standard" },
                ].map((m) => (
                  <tr key={m.name} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{m.input} cr</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{m.output} cr</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className={`text-[10px] ${
                        m.tier === "premium" ? "bg-violet-50 text-violet-600 border-violet-200" :
                        m.tier === "ultra" ? "bg-amber-50 text-amber-600 border-amber-200" :
                        "bg-blue-50 text-blue-600 border-blue-200"
                      }`}>{m.tier}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-base font-semibold mb-4">Transaction History</h2>
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            {transactions && transactions.length > 0 ? (
              <div className="divide-y divide-border/30">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.type === "purchase" ? "bg-emerald-50" :
                      tx.type === "usage" ? "bg-red-50" :
                      "bg-muted"
                    }`}>
                      {tx.type === "purchase" ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> :
                       tx.type === "usage" ? <Zap className="w-4 h-4 text-red-500" /> :
                       <Clock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                    <div className={`text-sm font-semibold ${tx.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{tx.balanceAfter.toLocaleString()} cr</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
