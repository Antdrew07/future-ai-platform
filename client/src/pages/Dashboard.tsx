import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Bot, Zap, BarChart3, CheckCircle2, Clock, XCircle, Plus,
  ArrowRight, Sparkles, TrendingUp, Activity
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    completed: { label: "Completed", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    running: { label: "Running", className: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
    failed: { label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/20" },
    queued: { label: "Queued", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border" },
  };
  const s = map[status] ?? map.cancelled!;
  return <Badge variant="outline" className={`text-xs ${s.className}`}>{s.label}</Badge>;
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = trpc.analytics.summary.useQuery();
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery({ limit: 5, offset: 0 });
  const { data: analytics } = trpc.analytics.usage.useQuery({ days: 14 });

  const chartData = analytics?.map(a => ({
    date: a.date.slice(5),
    credits: a.creditsUsed,
    tasks: a.taskCount,
  })) ?? [];

  const statCards = [
    {
      title: "Total Agents",
      value: summary?.agentCount ?? 0,
      icon: Bot,
      sub: `${summary?.activeAgents ?? 0} deployed`,
      gradient: "from-violet-500/20 to-violet-500/5",
      iconColor: "text-violet-400",
      iconBg: "bg-violet-500/10",
      borderColor: "border-violet-500/10",
    },
    {
      title: "Tasks Run",
      value: summary?.taskCount ?? 0,
      icon: Activity,
      sub: `${summary?.completedTasks ?? 0} completed`,
      gradient: "from-cyan-500/20 to-cyan-500/5",
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/10",
      borderColor: "border-cyan-500/10",
    },
    {
      title: "Credits Used",
      value: (summary?.totalCreditsUsed ?? 0).toLocaleString(),
      icon: Zap,
      sub: "This period",
      gradient: "from-gold/20 to-gold/5",
      iconColor: "text-gold",
      iconBg: "bg-gold/10",
      borderColor: "border-gold/10",
    },
    {
      title: "Credit Balance",
      value: (summary?.creditBalance ?? 0).toLocaleString(),
      icon: TrendingUp,
      sub: "Available",
      gradient: "from-emerald-500/20 to-emerald-500/5",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      borderColor: "border-emerald-500/10",
    },
  ];

  return (
    <FutureDashboardLayout title="Dashboard" subtitle="Welcome back — here's what's happening">
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.title} className={`glass card-hover rounded-xl p-5 relative overflow-hidden ${card.borderColor}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </div>
                <div className="text-2xl font-heading font-bold">{summaryLoading ? "—" : card.value}</div>
                <div className="text-xs font-medium text-muted-foreground mt-1">{card.title}</div>
                <div className="text-[11px] text-muted-foreground/60 mt-0.5">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Usage Chart */}
          <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <h3 className="text-sm font-heading font-semibold">Credit Usage</h3>
              <p className="text-[11px] text-muted-foreground">Last 14 days</p>
            </div>
            <div className="px-5 pb-5">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="credGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.22 280)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.65 0.22 280)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.45 0.01 260)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.45 0.01 260)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.14 0.008 260)", border: "1px solid oklch(0.22 0.008 260)", borderRadius: "10px", fontSize: "12px", fontFamily: "Space Grotesk" }}
                      labelStyle={{ color: "oklch(0.85 0.01 260)" }}
                    />
                    <Area type="monotone" dataKey="credits" stroke="oklch(0.65 0.22 280)" strokeWidth={2} fill="url(#credGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No usage data yet</p>
                    <p className="text-xs text-muted-foreground/60">Run your first task to see analytics</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-heading font-semibold">Quick Actions</h3>
            </div>
            <div className="px-5 pb-5 space-y-2">
              <Link href="/dashboard/agents/new">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-left hover:bg-accent/50 transition-all duration-200 group border border-transparent hover:border-border/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Create Agent</div>
                    <div className="text-[11px] text-muted-foreground">Build a new AI agent</div>
                  </div>
                </button>
              </Link>
              <Link href="/templates">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-left hover:bg-accent/50 transition-all duration-200 group border border-transparent hover:border-border/50">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Templates</div>
                    <div className="text-[11px] text-muted-foreground">Browse community agents</div>
                  </div>
                </button>
              </Link>
              <Link href="/dashboard/billing">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-left hover:bg-accent/50 transition-all duration-200 group border border-transparent hover:border-border/50">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <Zap className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Buy Credits</div>
                    <div className="text-[11px] text-muted-foreground">Top up your balance</div>
                  </div>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-semibold">Recent Tasks</h3>
              <p className="text-[11px] text-muted-foreground">Latest agent executions</p>
            </div>
            <Link href="/dashboard/agents">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="px-5 pb-5">
            {tasksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-accent/30 animate-pulse" />
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/30 group">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        task.status === "completed" ? "bg-emerald-500/10" :
                        task.status === "failed" ? "bg-destructive/10" :
                        task.status === "running" ? "bg-blue-500/10" : "bg-muted/50"
                      }`}>
                        {task.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                         task.status === "failed" ? <XCircle className="w-4 h-4 text-destructive" /> :
                         task.status === "running" ? <Activity className="w-4 h-4 text-blue-400 animate-pulse" /> :
                         <Clock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate group-hover:text-foreground">{task.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {task.creditsUsed} credits · {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">No tasks yet</p>
                <p className="text-xs text-muted-foreground/60 mb-5">Create an agent and run your first task</p>
                <Link href="/dashboard/agents/new">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 glow-subtle text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create Agent
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
