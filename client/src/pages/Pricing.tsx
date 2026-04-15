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
    credits: 1000,
    period: "month",
    description: "Get started with AI agents",
    features: ["1,000 credits/month", "3 agents", "Basic models (GPT-4o Mini)", "Community support"],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: 29,
    credits: 50000,
    period: "month",
    description: "For power users and developers",
    features: ["50,000 credits/month", "Unlimited agents", "All models (Claude, GPT-4o)", "API access", "Priority support", "Team collaboration (up to 5)"],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: 99,
    credits: 250000,
    period: "month",
    description: "For teams and organizations",
    features: ["250,000 credits/month", "Unlimited agents", "All models + Future Agent", "Advanced API access", "Dedicated support", "Unlimited team members", "Custom integrations"],
    cta: "Start Business",
    highlight: false,
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
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
            <Card key={plan.name} className={`relative ${plan.highlight ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10" : "bg-card/50 border-border/50"}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
                <div className="text-3xl font-black mt-2">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                </div>
                <div className="text-xs text-muted-foreground">{plan.description}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">{plan.credits.toLocaleString()} credits/month</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
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
              </CardContent>
            </Card>
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
              <Card key={pack.credits} className="bg-card/50 border-border/50 hover:border-primary/30 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold">{(pack.credits / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-muted-foreground mb-2">credits</div>
                  <div className="text-xl font-black">${pack.price}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Credits never expire. Payments via{" "}
            <a href="https://payloglobal.com" target="_blank" className="text-primary hover:underline">Payloglobal</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
