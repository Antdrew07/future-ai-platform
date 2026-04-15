import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  Bot, LayoutDashboard, BarChart3, CreditCard, Key, Users, Settings,
  Sparkles, LogOut, Shield, Store, ChevronRight, Zap, Menu, X
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/agents", icon: Bot, label: "My Agents" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { href: "/dashboard/api-keys", icon: Key, label: "API Keys" },
  { href: "/dashboard/teams", icon: Users, label: "Teams" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function FutureDashboardLayout({ children, title, subtitle }: Props) {
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Sign in to continue</h2>
          <a href={getLoginUrl()}>
            <Button className="glow-primary">Sign In</Button>
          </a>
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
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base tracking-tight text-sidebar-foreground">Future</span>
        </Link>
      </div>

      {/* Credit Balance */}
      <div className="p-3 mx-3 mt-3 rounded-lg border border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Credits</span>
          </div>
          <Link href="/dashboard/billing">
            <span className="text-xs text-primary hover:underline">Top up</span>
          </Link>
        </div>
        <div className="text-lg font-bold text-foreground mt-1">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
            </Link>
          );
        })}

        {/* Templates */}
        <Link href="/templates"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150">
          <Store className="w-4 h-4 flex-shrink-0" />
          Templates
        </Link>

        {/* Admin link */}
        {user?.role === "admin" && (
          <Link href="/admin"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive("/admin")
                ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                : "text-orange-400/70 hover:bg-orange-500/10 hover:text-orange-400"
            }`}>
            <Shield className="w-4 h-4 flex-shrink-0" />
            Admin Panel
            <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-orange-500/20 text-orange-400 border-0">
              Admin
            </Badge>
          </Link>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name ?? "User"}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</div>
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
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
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0 bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border/50 flex items-center px-4 md:px-6 gap-4 flex-shrink-0 bg-background/50 backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="md:hidden w-8 h-8" onClick={() => setMobileOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            {title && (
              <div>
                <h1 className="text-base font-semibold truncate">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              </div>
            )}
          </div>
          <Link href="/dashboard/agents/new">
            <Button size="sm" className="h-8 text-xs glow-primary hidden sm:flex">
              <Sparkles className="w-3 h-3 mr-1.5" />
              New Agent
            </Button>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
