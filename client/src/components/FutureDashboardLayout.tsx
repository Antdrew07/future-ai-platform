import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  Bot, LayoutDashboard, BarChart3, CreditCard, Key, Users, Settings,
  Sparkles, LogOut, Shield, Store, ChevronRight, Zap, Menu, X
} from "lucide-react";
import { useState } from "react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029617589/m5GbkNTBEjcM6aS7UZa8ie/future-logo_dd9d650b.png";

const NAV_ITEMS = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Home",      exact: true },
  { href: "/dashboard/agents",    icon: Bot,             label: "Agents" },
  { href: "/dashboard/billing",   icon: CreditCard,      label: "Billing" },
  { href: "/dashboard/settings",  icon: Settings,        label: "Settings" },
];

const NAV_SECONDARY = [
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/api-keys",  icon: Key,       label: "API Keys" },
  { href: "/dashboard/teams",     icon: Users,     label: "Teams" },
];

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showNewAgent?: boolean;
}

export default function FutureDashboardLayout({ children, title, subtitle, showNewAgent = true }: Props) {
  const { user, isAuthenticated, loading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: balance } = trpc.credits.balance.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center pulse-glow">
            <img src={LOGO_URL} alt="Future" className="w-10 h-10 object-contain" />
          </div>
          <div className="text-sm text-muted-foreground font-medium tracking-wide">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center glass rounded-2xl p-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <img src={LOGO_URL} alt="Future" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Welcome to Future</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in to access your AI workspace</p>
          <Link href="/signin">
            <Button className="bg-primary hover:bg-primary/90 glow-primary px-8">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (href: string, exact = false) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border/50">
        <Link href="/" className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Future" className="w-8 h-8 object-contain" />
          <span className="font-heading font-bold text-base tracking-tight text-foreground">Future</span>
        </Link>
      </div>

      {/* Credit Balance */}
      <div className="mx-3 mt-4 p-3 rounded-xl glass relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-gold" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Credits</span>
          </div>
          <Link href="/dashboard/billing">
            <span className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors">Top up</span>
          </Link>
        </div>
        <div className="text-xl font-heading font-bold text-foreground mt-1.5">
          {balance?.toLocaleString() ?? "—"}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 mt-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? "glass text-foreground glow-subtle"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? "text-primary" : "group-hover:text-primary/70"}`} />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
            </Link>
          );
        })}

        {/* Secondary nav */}
        <div className="divider-gradient my-2" />
        {NAV_SECONDARY.map((item) => {
          const active = isActive(item.href, false);
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? "glass text-foreground"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-accent/40"
              }`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${ active ? "text-primary" : "group-hover:text-primary/60" }`} />
              {item.label}
            </Link>
          );
        })}

        {/* Templates */}
        <Link href="/templates"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground/60 hover:text-foreground hover:bg-accent/40 transition-all duration-200 group">
          <Store className="w-4 h-4 flex-shrink-0 group-hover:text-primary/60 transition-colors" />
          Templates
        </Link>

        {/* Admin link */}
        {user?.role === "admin" && (
          <>
            <div className="divider-gradient my-3" />
            <Link href="/admin"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive("/admin")
                  ? "glass text-gold glow-gold"
                  : "text-gold-dim hover:text-gold hover:bg-accent/50"
              }`}>
              <Shield className="w-4 h-4 flex-shrink-0" />
              Admin Panel
              <Badge className="ml-auto text-[9px] px-1.5 py-0 bg-gold/10 text-gold border border-gold/20 font-semibold">
                Admin
              </Badge>
            </Link>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-blue/20 flex items-center justify-center flex-shrink-0 border border-primary/10">
            <span className="text-xs font-heading font-bold text-primary">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-heading font-semibold truncate">{user?.name ?? "User"}</div>
            <div className="text-[11px] text-muted-foreground truncate">{user?.email ?? ""}</div>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0 text-muted-foreground hover:text-foreground rounded-lg"
            onClick={() => logout()}>
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col flex-shrink-0 bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border/40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-sidebar border-r border-sidebar-border/40 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border/30 flex items-center px-4 md:px-6 gap-4 flex-shrink-0 glass-strong">
          <Button variant="ghost" size="icon" className="md:hidden w-8 h-8 rounded-lg" onClick={() => setMobileOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            {title && (
              <div>
                <h1 className="text-base font-heading font-semibold truncate">{title}</h1>
                {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
              </div>
            )}
          </div>
          {showNewAgent && (
            <Link href="/dashboard/agents/new">
              <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 glow-subtle rounded-lg hidden sm:flex font-medium">
                <Sparkles className="w-3 h-3 mr-1.5" />
                New Agent
              </Button>
            </Link>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
