import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      title: "Tasks Run",
      value: summary?.taskCount ?? 0,
      icon: Activity,
      sub: `${summary?.completedTasks ?? 0} completed`,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      title: "Credits Used",
      value: (summary?.totalCreditsUsed ?? 0).toLocaleString(),
      icon: Zap,
      sub: "This period",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      title: "Credit Balance",
      value: (summary?.creditBalance ?? 0).toLocaleString(),
      icon: TrendingUp,
      sub: "Available",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <FutureDashboardLayout title="Dashboard" subtitle="Welcome back — here's what's happening">
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.title} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{summaryLoading ? "—" : card.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{card.title}</div>
                <div className="text-xs text-muted-foreground/60 mt-0.5">{card.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart + Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Usage Chart */}
          <Card className="lg:col-span-2 bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Credit Usage (14 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="credGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.22 280)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.65 0.22 280)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.12 0.008 260)", border: "1px solid oklch(0.22 0.008 260)", borderRadius: "8px", fontSize: "12px" }}
                      labelStyle={{ color: "oklch(0.85 0.01 260)" }}
                    />
                    <Area type="monotone" dataKey="credits" stroke="oklch(0.65 0.22 280)" strokeWidth={2} fill="url(#credGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                  No usage data yet. Run your first task!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/agents/new">
                <Button className="w-full justify-start gap-2 h-9 text-sm" variant="outline">
                  <Plus className="w-4 h-4 text-primary" />
                  Create New Agent
                </Button>
              </Link>
              <Link href="/templates">
                <Button className="w-full justify-start gap-2 h-9 text-sm" variant="outline">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Browse Templates
                </Button>
              </Link>
              <Link href="/dashboard/billing">
                <Button className="w-full justify-start gap-2 h-9 text-sm" variant="outline">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Buy Credits
                </Button>
              </Link>
              <Link href="/dashboard/api-keys">
                <Button className="w-full justify-start gap-2 h-9 text-sm" variant="outline">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  API Keys
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Tasks</CardTitle>
            <Link href="/dashboard/agents">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        task.status === "completed" ? "bg-emerald-500/10" :
                        task.status === "failed" ? "bg-destructive/10" :
                        task.status === "running" ? "bg-blue-500/10" : "bg-muted"
                      }`}>
                        {task.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                         task.status === "failed" ? <XCircle className="w-4 h-4 text-destructive" /> :
                         task.status === "running" ? <Activity className="w-4 h-4 text-blue-400 animate-pulse" /> :
                         <Clock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {task.creditsUsed} credits · {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No tasks yet. Create an agent to get started.</p>
                <Link href="/dashboard/agents/new">
                  <Button size="sm" className="glow-primary">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create Agent
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FutureDashboardLayout>
  );
}
