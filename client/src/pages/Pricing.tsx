import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { CheckCircle2, Sparkles, Zap, ArrowLeft } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: 0,
    credits: 500,
    period: "month",
    description: "Try Future at no cost",
    features: ["500 credits/month", "1 project", "Basic AI tasks", "Community support"],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Starter",
    price: 9,
    credits: 5000,
    period: "month",
    description: "Perfect for individuals",
    features: ["5,000 credits/month", "5 projects", "All task types", "Email support"],
    cta: "Start Starter",
    highlight: false,
  },
  {
    name: "Pro",
    price: 29,
    credits: 25000,
    period: "month",
    description: "For power users and small teams",
    features: ["25,000 credits/month", "Unlimited projects", "Team collaboration (up to 5)", "API access", "Priority support"],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: 99,
    credits: 100000,
    period: "month",
    description: "For growing teams and organizations",
    features: ["100,000 credits/month", "Everything in Pro", "Up to 25 team members", "Advanced analytics", "Custom models", "Dedicated support", "SLA guarantee"],
    cta: "Start Business",
    highlight: false,
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Future</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </Button>
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" className="glow-primary">Dashboard</Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="sm" className="glow-primary">Get Started</Button>
            </a>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4">
            Simple, <span className="gradient-text">transparent</span> pricing
          </h1>
          <p className="text-muted-foreground text-lg">
            Start free, scale as you grow. No surprises.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`relative bg-white border border-border rounded-xl shadow-sm ${plan.highlight ? "border-primary/30 ring-1 ring-primary/20 shadow-lg shadow-primary/10" : ""}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">Most Popular</Badge>
                </div>
              )}
              <div className="px-5 pt-5 pb-4">
                <h3 className="text-base font-heading font-semibold">{plan.name}</h3>
                <div className="text-3xl font-black mt-2">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                </div>
                <div className="text-xs text-muted-foreground">{plan.description}</div>
              </div>
              <div className="px-5 pb-5 space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">{plan.credits.toLocaleString()} credits/month</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isAuthenticated ? (
                  <Link href="/dashboard/billing">
                    <Button className={`w-full ${plan.highlight ? "glow-primary" : ""}`}
                      variant={plan.highlight ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button className={`w-full ${plan.highlight ? "glow-primary" : ""}`}
                      variant={plan.highlight ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pay as you go */}
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Need more credits?</h2>
          <p className="text-muted-foreground text-sm mb-6">Top up anytime with pay-as-you-go credit packs</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { credits: 10000, price: 5 },
              { credits: 50000, price: 20 },
              { credits: 150000, price: 50 },
              { credits: 500000, price: 150 },
            ].map((pack) => (
              <div key={pack.credits} className="bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all p-4 text-center">
                  <div className="text-lg font-bold">{(pack.credits / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-muted-foreground mb-2">credits</div>
                  <div className="text-xl font-black">${pack.price}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Credits never expire. Payments via{" "}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
