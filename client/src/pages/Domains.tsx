import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Globe, CheckCircle, XCircle, ShoppingCart, RefreshCw, ExternalLink, Calendar } from "lucide-react";

// ─── Domain Search Results ────────────────────────────────────────────────────

function DomainResult({
  domain,
  tld,
  available,
  price,
  renewal,
  onBuy,
}: {
  domain: string;
  tld: string;
  available: boolean;
  price: number;
  renewal: number;
  onBuy: (domain: string, price: number) => void;
}) {
  const tldColors: Record<string, string> = {
    com: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    io:  "bg-purple-500/20 text-purple-400 border-purple-500/30",
    ai:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    co:  "bg-orange-500/20 text-orange-400 border-orange-500/30",
    app: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    dev: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    net: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    org: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };
  const tldClass = tldColors[tld] ?? "bg-slate-500/20 text-slate-400 border-slate-500/30";

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
      available
        ? "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
        : "border-white/5 bg-white/2 opacity-50"
    }`}>
      <div className="flex items-center gap-3">
        {available
          ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          : <XCircle className="w-5 h-5 text-red-400/60 shrink-0" />
        }
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{domain.split(".")[0]}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tldClass}`}>.{tld}</span>
          </div>
          {available && (
            <p className="text-xs text-white/40 mt-0.5">Renews at ${renewal}/yr</p>
          )}
          {!available && (
            <p className="text-xs text-red-400/60 mt-0.5">Already registered</p>
          )}
        </div>
      </div>
      {available && (
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white">${price}<span className="text-sm font-normal text-white/50">/yr</span></span>
          <Button
            size="sm"
            onClick={() => onBuy(domain, price)}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-4"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            Buy
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Purchase Dialog ──────────────────────────────────────────────────────────

function PurchaseDialog({
  domain,
  price,
  open,
  onClose,
}: {
  domain: string;
  price: number;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    country: "US",
  });

  const purchase = trpc.domains.purchase.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to checkout...");
        window.open(data.checkoutUrl, "_blank");
        onClose();
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    purchase.mutate({
      domain,
      years: 1,
      origin: window.location.origin,
      ...form,
    });
  };

  const f = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [k]: e.target.value })),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f0f1a] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Register {domain}</DialogTitle>
          <DialogDescription className="text-white/50">
            ${price}/year — Complete your contact details for domain registration
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">First Name *</Label>
              <Input {...f("firstName")} required placeholder="John" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Last Name *</Label>
              <Input {...f("lastName")} required placeholder="Doe" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-xs">Email *</Label>
            <Input {...f("email")} type="email" required placeholder="you@example.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-xs">Phone *</Label>
            <Input {...f("phone")} required placeholder="+1 555 000 0000" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-xs">Address *</Label>
            <Input {...f("address")} required placeholder="123 Main St" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">City *</Label>
              <Input {...f("city")} required placeholder="New York" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">State / Province *</Label>
              <Input {...f("stateProvince")} required placeholder="NY" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Postal Code *</Label>
              <Input {...f("postalCode")} required placeholder="10001" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Country Code *</Label>
              <Input {...f("country")} required placeholder="US" maxLength={2} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 uppercase" />
            </div>
          </div>
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-sm">Total (1 year)</span>
              <span className="text-white font-bold text-lg">${price}</span>
            </div>
            <Button
              type="submit"
              disabled={purchase.isPending}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white"
            >
              {purchase.isPending ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><ShoppingCart className="w-4 h-4 mr-2" /> Proceed to Checkout</>
              )}
            </Button>
            <p className="text-xs text-white/30 text-center mt-2">Secured by Stripe · Privacy protected with free WHOIS guard</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── My Domains ───────────────────────────────────────────────────────────────

function MyDomains() {
  const { data: domains, isLoading } = trpc.domains.listMyDomains.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!domains?.length) {
    return (
      <div className="text-center py-12 text-white/40">
        <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No domains yet. Search above to register your first domain.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {domains.map(d => (
        <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-violet-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">{d.domain}</p>
              <p className="text-xs text-white/40">
                {d.status === "active" ? "Active" : d.status === "pending" ? "Pending" : d.status}
                {d.expiresAt && ` · Expires ${new Date(d.expiresAt).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${
              d.status === "active" ? "border-emerald-500/30 text-emerald-400" :
              d.status === "pending" ? "border-yellow-500/30 text-yellow-400" :
              "border-red-500/30 text-red-400"
            }`}>
              {d.status}
            </Badge>
            {d.dnsConfigured && (
              <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                DNS ✓
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Domains Page ────────────────────────────────────────────────────────

export default function DomainsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [buyDomain, setBuyDomain] = useState<{ domain: string; price: number } | null>(null);
  const [completingPurchase, setCompletingPurchase] = useState(false);

  const utils = trpc.useUtils();
  const completePurchase = trpc.domains.completePurchase.useMutation({
    onSuccess: (data) => {
      toast.success(`🎉 Domain ${data.domain} registered successfully!`);
      utils.domains.listMyDomains.invalidate();
      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("purchased");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: () => {
      setCompletingPurchase(false);
    },
  });

  // Handle Stripe success redirect — auto-complete the domain purchase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchased = params.get("purchased");
    const sessionId = params.get("session_id");
    if (purchased && sessionId && !completingPurchase) {
      setCompletingPurchase(true);
      toast.info(`Processing domain registration for ${purchased}...`);
      completePurchase.mutate({ domain: purchased, stripeSessionId: sessionId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: searchResults, isLoading: searching } = trpc.domains.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
    if (clean.length >= 2) setSearchQuery(clean);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center text-white/50">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Please sign in to search and purchase domains.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0f0f1a]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-7 h-7 text-violet-400" />
            <h1 className="text-2xl font-bold">Domain Names</h1>
          </div>
          <p className="text-white/50 text-sm">Search, register, and manage your domains — all in one place.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Search */}
        <Card className="bg-[#0f0f1a] border-white/10">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search for your perfect domain name..."
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={query.length < 2 || searching}
                className="bg-violet-600 hover:bg-violet-500 text-white h-12 px-6"
              >
                {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </form>

            {/* Popular TLDs */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[".com", ".io", ".ai", ".co", ".app", ".dev"].map(tld => (
                <button
                  key={tld}
                  onClick={() => {
                    if (query.length >= 2) {
                      setSearchQuery(query.toLowerCase().replace(/[^a-z0-9-]/g, "").trim());
                    }
                  }}
                  className="text-xs px-3 py-1 rounded-full border border-white/10 text-white/50 hover:border-violet-500/50 hover:text-violet-400 transition-colors"
                >
                  {tld}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults && (
          <Card className="bg-[#0f0f1a] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white/80">
                Results for <span className="text-white font-bold">"{searchResults.base}"</span>
                <span className="ml-2 text-sm font-normal text-white/40">
                  {searchResults.results.filter(r => r.available).length} available
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {searchResults.results.map(r => (
                <DomainResult
                  key={r.domain}
                  {...r}
                  onBuy={(domain, price) => setBuyDomain({ domain, price })}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* My Domains */}
        <Card className="bg-[#0f0f1a] border-white/10">
          <CardHeader>
            <CardTitle className="text-base text-white/80 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              My Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MyDomains />
          </CardContent>
        </Card>

        {/* Info Banner */}
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="flex gap-3">
            <Globe className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">DNS auto-configured</p>
              <p className="text-xs text-white/50 mt-1">
                When you build a website with Future AI and purchase a domain here, we automatically connect your domain to your website. No DNS configuration needed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Dialog */}
      {buyDomain && (
        <PurchaseDialog
          domain={buyDomain.domain}
          price={buyDomain.price}
          open={!!buyDomain}
          onClose={() => setBuyDomain(null)}
        />
      )}
    </div>
  );
}
