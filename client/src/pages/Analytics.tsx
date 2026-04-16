import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Zap, Activity, Bot, TrendingUp } from "lucide-react";

const COLORS = [
  "oklch(0.65 0.22 280)",
  "oklch(0.65 0.18 200)",
  "oklch(0.65 0.18 160)",
  "oklch(0.75 0.18 80)",
  "oklch(0.65 0.18 340)",
];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "oklch(0.12 0.008 260)",
    border: "1px solid oklch(0.22 0.008 260)",
    borderRadius: "8px",
    fontSize: "12px",
  },
  labelStyle: { color: "oklch(0.85 0.01 260)" },
};

export default function Analytics() {
  const [days, setDays] = useState(30);
  const { data: usage } = trpc.analytics.usage.useQuery({ days });
  const { data: summary } = trpc.analytics.summary.useQuery();
  // modelBreakdown not yet in router — using local placeholder
  const modelBreakdown: { modelId: string; creditsUsed: number }[] = [];

  const chartData = usage?.map(d => ({
    date: d.date.slice(5),
    credits: d.creditsUsed,
    tasks: d.taskCount,
    tokens: (d.inputTokens ?? 0) + (d.outputTokens ?? 0),
  })) ?? [];

  const pieData = modelBreakdown?.map((m: { modelId: string; creditsUsed: number }, i: number) => ({
    name: m.modelId.replace("gpt-4o", "Future-1 Pro").replace("claude-3-5-sonnet-20241022", "Future-1 Code").replace("claude-3-haiku-20240307", "Future-1 Fast").replace("future-agent-1", "Future-1 Ultra").replace("gpt-4o-mini", "Future-1 Mini"),
    value: m.creditsUsed,
    color: COLORS[i % COLORS.length],
  })) ?? [];

  const statCards = [
    { title: "Total Credits Used", value: (summary?.totalCreditsUsed ?? 0).toLocaleString(), icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { title: "Total Tasks", value: (summary?.taskCount ?? 0).toLocaleString(), icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
    { title: "Active Agents", value: (summary?.activeAgents ?? 0).toLocaleString(), icon: Bot, color: "text-violet-400", bg: "bg-violet-500/10" },
    { title: "Success Rate", value: summary?.taskCount ? `${Math.round(((summary.completedTasks ?? 0) / summary.taskCount) * 100)}%` : "—", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <FutureDashboardLayout title="Analytics" subtitle="Monitor your platform usage and performance">
      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div />
          <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
            <SelectTrigger className="w-36 h-8 text-xs bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.title} className="glass card-hover rounded-xl p-4">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3 ring-1 ring-white/5`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{card.title}</div>
            </div>
          ))}
        </div>

        {/* Credit Usage Chart */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <h3 className="text-sm font-heading font-medium">Credit Usage Over Time</h3>
          </div>
          <div className="px-5 pb-5">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="credGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.22 280)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.65 0.22 280)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="credits" name="Credits" stroke="oklch(0.65 0.22 280)" strokeWidth={2} fill="url(#credGrad2)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data for this period</div>
            )}
          </div>
        </div>

        {/* Tasks + Model Breakdown */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <h3 className="text-sm font-heading font-medium">Tasks Per Day</h3>
            </div>
            <div className="px-5 pb-5">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="tasks" name="Tasks" fill="oklch(0.65 0.18 200)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </div>
          </div>

          <div className="glass rounded-xl overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <h3 className="text-sm font-heading font-medium">Credits by Model</h3>
            </div>
            <div className="px-5 pb-5">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry: { name: string; value: number; color: string }, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No model usage data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
