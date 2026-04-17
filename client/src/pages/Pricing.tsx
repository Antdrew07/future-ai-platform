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
    name: "Free Trial",
    price: 0,
    credits: 50,
    powerCredits: 50,
    quickCredits: 500,
    period: "7 days",
    description: "Full access for 7 days — no card needed",
    features: [
      "7-day full-feature trial",
      "50 Power Credits to try any task",
      "Build a website, write a report, or research anything",
      "No credit card required",
    ],
    cta: "Start Free Trial",
    highlight: false,
    badge: null,
  },
  {
    name: "Starter",
    price: 49,
    credits: 500,
    powerCredits: 500,
    quickCredits: 5000,
    period: "month",
    description: "For solopreneurs and freelancers",
    features: [
      "500 Power Credits / month",
      "5,000 Quick Credits / month",
      "~50 website builds or research tasks",
      "Unlimited projects",
      "Email support",
      "Mobile app access",
    ],
    cta: "Start Starter",
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    price: 100,
    credits: 1200,
    powerCredits: 1200,
    quickCredits: 12000,
    period: "month",
    description: "For growing businesses and consultants",
    features: [
      "1,200 Power Credits / month",
      "12,000 Quick Credits / month",
      "~120 website builds or research tasks",
      "Unlimited projects",
      "Priority support",
      "API access",
      "Advanced analytics",
    ],
    cta: "Start Pro",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Business",
    price: 199,
    credits: 2800,
    powerCredits: 2800,
    quickCredits: 28000,
    period: "month",
    description: "For agencies and teams",
    features: [
      "2,800 Power Credits / month",
      "28,000 Quick Credits / month",
      "~280 website builds or research tasks",
      "Everything in Pro",
      "Up to 10 team members",
      "Custom AI agents",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Start Business",
    highlight: false,
    badge: null,
  },
  {
    name: "Enterprise",
    price: 500,
    credits: 8000,
    powerCredits: 8000,
    quickCredits: 80000,
    period: "month",
    description: "For large organizations",
    features: [
      "8,000 Power Credits / month",
      "80,000 Quick Credits / month",
      "~800 website builds or research tasks",
      "Everything in Business",
      "Unlimited team members",
      "White-label options",
      "Custom integrations",
      "Dedicated account manager",
      "99.9% uptime SLA",
    ],
    cta: "Contact Sales",
    highlight: false,
    badge: "Best Value",
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-16">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`relative bg-white border border-border rounded-xl shadow-sm flex flex-col ${plan.highlight ? "border-primary/30 ring-1 ring-primary/20 shadow-lg shadow-primary/10" : ""}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge className={`text-xs px-3 ${plan.highlight ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"}`}>{plan.badge}</Badge>
                </div>
              )}
              <div className="px-4 pt-5 pb-3">
                <h3 className="text-sm font-heading font-semibold">{plan.name}</h3>
                <div className="text-2xl font-black mt-1.5">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{plan.description}</div>
              </div>
              <div className="px-4 pb-4 space-y-3 flex-1 flex flex-col">
                <div className="rounded-lg bg-muted border border-border p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-xs font-semibold text-foreground">{plan.powerCredits.toLocaleString()} Power Credits</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{plan.quickCredits.toLocaleString()} Quick Credits</span>
                  </div>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  {isAuthenticated ? (
                    <Link href="/dashboard/billing">
                      <Button className={`w-full text-xs ${plan.highlight ? "glow-primary" : ""}`}
                        variant={plan.highlight ? "default" : "outline"} size="sm">
                        {plan.cta}
                      </Button>
                    </Link>
                  ) : (
                    <a href={getLoginUrl()}>
                      <Button className={`w-full text-xs ${plan.highlight ? "glow-primary" : ""}`}
                        variant={plan.highlight ? "default" : "outline"} size="sm">
                        {plan.cta}
                      </Button>
                    </a>
                  )}
                </div>
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
