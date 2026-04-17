import { useEffect, useState } from "react";
import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Zap, CreditCard, TrendingUp, Clock, ArrowUpRight,
  ExternalLink, CheckCircle2, Sparkles, Crown, Building2, Star, Coins, Gift
} from "lucide-react";

// ─── Plan visual config ───────────────────────────────────────────────────────
const PLAN_META: Record<string, {
  icon: React.ReactNode;
  border: string;
  badge: string;
  btnClass: string;
  glow: string;
}> = {
  free:     { icon: <Sparkles className="w-4 h-4 text-gray-500" />,   border: "border-gray-200",   badge: "bg-gray-100 text-gray-600",     btnClass: "bg-gray-800 hover:bg-gray-700 text-white",   glow: "" },
  starter:  { icon: <Zap className="w-4 h-4 text-blue-500" />,        border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",     btnClass: "bg-blue-600 hover:bg-blue-700 text-white",   glow: "" },
  pro:      { icon: <Crown className="w-4 h-4 text-violet-600" />,    border: "border-violet-300", badge: "bg-violet-100 text-violet-700", btnClass: "bg-violet-600 hover:bg-violet-700 text-white", glow: "shadow-lg shadow-violet-100" },
  business: { icon: <Building2 className="w-4 h-4 text-amber-600" />, border: "border-amber-200",  badge: "bg-amber-100 text-amber-700",   btnClass: "bg-amber-600 hover:bg-amber-700 text-white",  glow: "" },
};

const PLAN_ORDER = ["free", "starter", "pro", "business"];

function formatCredits(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

// ─── Fallback data (shown while DB loads) ────────────────────────────────────
const FALLBACK_PLANS = [
  { id: 1, slug: "free",       name: "Free",       priceUsd: 0,   monthlyCredits: 500,    features: ["3 agents", "500 credits/month", "Community support", "Basic analytics"] },
  { id: 2, slug: "starter",    name: "Starter",    priceUsd: 19,  monthlyCredits: 2000,   features: ["10 agents", "2,000 credits/month", "Email support", "Full analytics", "API access"] },
  { id: 3, slug: "pro",        name: "Pro",         priceUsd: 49,  monthlyCredits: 8000,   features: ["Unlimited agents", "8,000 credits/month", "Priority support", "Advanced analytics", "API access", "Team collaboration"] },
  { id: 4, slug: "business",   name: "Business",   priceUsd: 99,  monthlyCredits: 100000, features: ["Everything in Pro", "100,000 credits/month", "Advanced analytics", "Custom models", "Dedicated support", "SLA guarantee"] },
  { id: 5, slug: "enterprise", name: "Enterprise",  priceUsd: 199, monthlyCredits: 50000,  features: ["Unlimited everything", "50,000 credits/month", "Dedicated support", "Custom SLA", "On-premise option"] },
];

const FALLBACK_PACKS = [
  { id: 1, name: "Small Top-up",  credits: 1000,  priceUsd: 5,  isPopular: false },
  { id: 2, name: "Medium Top-up", credits: 5000,  priceUsd: 19, isPopular: true },
  { id: 3, name: "Large Top-up",  credits: 15000, priceUsd: 49, isPopular: false },
];

export default function Billing() {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const { data: balance = 0, refetch: refetchBalance } = trpc.credits.balance.useQuery();
  const { data: rawPlans } = trpc.credits.plans.useQuery();
  const { data: rawPacks } = trpc.credits.packs.useQuery();
  const { data: transactions } = trpc.credits.transactions.useQuery({ limit: 15 });
  const currentSub = null; // subscription management via plan upgrade flow

  // Use DB data if available, otherwise fallback
  const plans = (rawPlans && rawPlans.length > 0) ? rawPlans : FALLBACK_PLANS;
  const packs = (rawPacks && rawPacks.length > 0) ? rawPacks : FALLBACK_PACKS;

  const currentPlanSlug = "free"; // will be dynamic once subscription management is added

  // Handle Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      toast.success("Payment successful! Credits have been added to your account.", { duration: 6000 });
      void refetchBalance();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("cancelled") === "1") {
      toast.info("Payment cancelled. No charges were made.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refetchBalance]);

  const checkoutMutation = trpc.credits.checkout.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.info("Redirecting to Stripe checkout...");
      setCheckoutLoading(null);
    },
    onError: (err) => {
      toast.error(err.message ?? "Checkout failed");
      setCheckoutLoading(null);
    },
  });

  const handlePlanCheckout = (plan: { id: number; slug: string; name: string; priceUsd: number; monthlyCredits: number; features: unknown }) => {
    const key = `plan-${plan.id}`;
    setCheckoutLoading(key);
    checkoutMutation.mutate({
      credits: plan.monthlyCredits,
      priceUsd: plan.priceUsd,
      packName: `${plan.name} Plan`,
      origin: window.location.origin,
    });
  };

  const handlePackCheckout = (pack: { id: number; name: string; credits: number; priceUsd: number; isPopular: boolean }) => {
    const key = `pack-${pack.id}`;
    setCheckoutLoading(key);
    checkoutMutation.mutate({
      credits: pack.credits,
      priceUsd: pack.priceUsd,
      packName: pack.name,
      origin: window.location.origin,
    });
  };

  const getPlanStatus = (slug: string) => {
    const ci = PLAN_ORDER.indexOf(currentPlanSlug);
    const ti = PLAN_ORDER.indexOf(slug);
    if (ti === ci) return "current";
    return ti > ci ? "upgrade" : "downgrade";
  };

  return (
    <FutureDashboardLayout title="Billing" subtitle="Manage your plan and credits">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">

        {/* ── Credit Balance Banner ── */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-violet-50 p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Coins className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Available Credits</p>
              <p className="text-4xl font-bold text-foreground">{balance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {"Free plan · 500 credits/month"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              {PLAN_META[currentPlanSlug]?.icon ?? <Sparkles className="w-4 h-4" />}
              <span className="font-semibold text-foreground capitalize">{currentPlanSlug} Plan</span>
            </div>
            {null}
          </div>
        </div>

        {/* ── Subscription Plans ── */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Choose Your Plan</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const meta = PLAN_META[plan.slug] ?? PLAN_META.free;
              const status = getPlanStatus(plan.slug);
              const features = Array.isArray(plan.features) ? plan.features as string[] : [];
              const isLoading = checkoutLoading === `plan-${plan.id}`;

              return (
                <div key={plan.id} className={`relative rounded-2xl border-2 ${meta.border} bg-white p-5 flex flex-col gap-4 ${meta.glow} transition-all hover:scale-[1.01]`}>
                  {/* Status badge */}
                  {status === "current" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-sm">
                        ✓ Current Plan
                      </span>
                    </div>
                  )}
                  {plan.slug === "pro" && status !== "current" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-semibold shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3" /> Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    {meta.icon}
                    <span className="font-semibold text-foreground">{plan.name}</span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {plan.priceUsd === 0 ? "Free" : `$${plan.priceUsd}`}
                      </span>
                      {plan.priceUsd > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
                    </div>
                    <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${meta.badge}`}>
                      <Zap className="w-3 h-3" />
                      {formatCredits(plan.monthlyCredits)} credits/mo
                    </div>
                  </div>

                  <ul className="space-y-1.5 flex-1">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-9 text-sm font-medium rounded-xl ${meta.btnClass}`}
                    disabled={status === "current" || isLoading || plan.priceUsd === 0}
                    onClick={() => handlePlanCheckout(plan)}
                  >
                    {isLoading ? "Loading..." :
                     status === "current" ? "Current Plan" :
                     plan.priceUsd === 0 ? "Free Forever" :
                     status === "upgrade" ? "Upgrade" : "Downgrade"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Top-up Credits ── */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Gift className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Need More Credits?</h2>
            <span className="text-sm text-muted-foreground">One-time top-up, no subscription required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {packs.map((pack) => {
              const isLoading = checkoutLoading === `pack-${pack.id}`;
              return (
                <div key={pack.id} className={`relative rounded-2xl border-2 bg-white p-5 flex flex-col gap-3 transition-all hover:scale-[1.01] ${
                  pack.isPopular ? "border-violet-300 shadow-md shadow-violet-100" : "border-border"
                }`}>
                  {pack.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-semibold shadow-sm">
                        Best Value
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-semibold text-foreground">{pack.name}</span>
                    <Coins className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCredits(pack.credits)}</p>
                    <p className="text-sm text-muted-foreground">credits</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-foreground">${pack.priceUsd}</span>
                    <span className="text-xs text-muted-foreground">
                      ${(pack.priceUsd / pack.credits * 1000).toFixed(2)}/1K cr
                    </span>
                  </div>
                  <Button
                    className="w-full h-9 text-sm font-medium rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    disabled={isLoading}
                    onClick={() => handlePackCheckout(pack)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {isLoading ? "Loading..." : "Buy Now"}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Payments processed securely via{" "}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe</a>.
            Credits never expire. Use test card <span className="font-mono bg-muted px-1 rounded">4242 4242 4242 4242</span> in sandbox mode.
          </p>
        </div>

        {/* ── Transaction History ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Transaction History</h2>
          </div>
          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
            {transactions && transactions.length > 0 ? (
              <div className="divide-y divide-border/40">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === "purchase" || tx.type === "subscription" ? "bg-emerald-50" :
                      tx.type === "usage" ? "bg-red-50" : "bg-muted"
                    }`}>
                      {tx.type === "purchase" || tx.type === "subscription"
                        ? <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        : tx.type === "usage"
                        ? <Zap className="w-4 h-4 text-red-500" />
                        : <Clock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize shrink-0 ${
                      tx.type === "purchase" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
                      tx.type === "usage" ? "border-orange-300 text-orange-700 bg-orange-50" :
                      tx.type === "subscription" ? "border-blue-300 text-blue-700 bg-blue-50" :
                      "border-gray-300 text-gray-700"
                    }`}>
                      {tx.type}
                    </Badge>
                    <span className={`text-sm font-semibold font-mono shrink-0 ${tx.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono shrink-0 hidden sm:block">
                      {tx.balanceAfter.toLocaleString()} cr
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No transactions yet. Buy credits or upgrade your plan to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
