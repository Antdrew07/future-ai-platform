import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "wouter";
import { Link } from "wouter";
import {
  ArrowLeft, Brain, Zap, Terminal, CheckCircle2, XCircle, Clock,
  Activity, Wrench, MessageSquare, AlertCircle, Star
} from "lucide-react";
import { Streamdown } from "streamdown";

function StepIcon({ type }: { type: string }) {
  const map: Record<string, { icon: typeof Brain; color: string }> = {
    thought: { icon: Brain, color: "text-violet-400" },
    tool_call: { icon: Wrench, color: "text-cyan-400" },
    tool_result: { icon: Terminal, color: "text-emerald-400" },
    llm_response: { icon: MessageSquare, color: "text-blue-400" },
    error: { icon: AlertCircle, color: "text-destructive" },
    final: { icon: Star, color: "text-yellow-400" },
  };
  const s = map[type] ?? map.thought!;
  return <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />;
}

function StepClass(type: string) {
  const map: Record<string, string> = {
    thought: "step-thought",
    tool_call: "step-tool",
    tool_result: "step-result",
    llm_response: "step-result",
    error: "step-error",
    final: "step-final",
  };
  return map[type] ?? "";
}

export default function TaskView() {
  const params = useParams<{ id: string }>();
  const taskId = parseInt(params.id ?? "0");

  const { data: task, isLoading } = trpc.tasks.get.useQuery({ id: taskId }, {
    refetchInterval: (query) => {
      const d = query.state.data;
      return d?.status === "running" ? 2000 : false;
    },
  });
  const { data: steps } = trpc.tasks.getSteps.useQuery({ taskId }, {
    refetchInterval: task?.status === "running" ? 2000 : false,
  });

  const STATUS_CONFIG: Record<string, { label: string; icon: typeof Activity; className: string }> = {
    completed: { label: "Completed", icon: CheckCircle2, className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    running: { label: "Running", icon: Activity, className: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    failed: { label: "Failed", icon: XCircle, className: "text-destructive bg-destructive/10 border-destructive/20" },
    queued: { label: "Queued", icon: Clock, className: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
    cancelled: { label: "Cancelled", icon: XCircle, className: "text-muted-foreground bg-muted border-border" },
  };

  const statusCfg = STATUS_CONFIG[task?.status ?? "queued"] ?? STATUS_CONFIG.queued!;

  return (
    <FutureDashboardLayout title="Task Execution" subtitle={task?.title}>
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground mb-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Agents
          </Button>
        </Link>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : task ? (
          <>
            {/* Task Header */}
            <Card className="bg-white border-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-base mb-2 leading-snug">{task.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-3">{task.input}</p>
                  </div>
                  <Badge variant="outline" className={`flex items-center gap-1.5 flex-shrink-0 ${statusCfg.className}`}>
                    <statusCfg.icon className={`w-3 h-3 ${task.status === "running" ? "animate-pulse" : ""}`} />
                    {statusCfg.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/30">
                  {[
                    { label: "Credits Used", value: task.creditsUsed.toLocaleString(), icon: Zap, color: "text-yellow-400" },
                    { label: "Steps", value: task.stepCount, icon: Activity, color: "text-blue-400" },
                    { label: "Input Tokens", value: task.inputTokens.toLocaleString(), icon: Brain, color: "text-violet-400" },
                    { label: "Output Tokens", value: task.outputTokens.toLocaleString(), icon: MessageSquare, color: "text-emerald-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-2 rounded-lg bg-muted/20">
                      <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                      <div className="text-sm font-bold">{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Execution Log */}
            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Execution Log
                  {task.status === "running" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse ml-1" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {steps && steps.length > 0 ? (
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <div key={step.id} className={`${StepClass(step.type)} py-2 pl-3`}>
                        <div className="flex items-start gap-2.5">
                          <StepIcon type={step.type} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium capitalize text-muted-foreground">
                                {step.type.replace("_", " ")}
                              </span>
                              <span className="text-[10px] text-muted-foreground/50">Step {step.stepNumber}</span>
                              {step.creditsUsed > 0 && (
                                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                                  <Zap className="w-2.5 h-2.5" />{step.creditsUsed.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <div className="text-sm">
                              {step.type === "llm_response" || step.type === "final" ? (
                                <Streamdown>{String(step.content)}</Streamdown>
                              ) : (
                                <pre className="whitespace-pre-wrap font-mono text-xs text-foreground/80 leading-relaxed">
                                  {step.content}
                                </pre>
                              )}
                            </div>
                            {step.toolInput != null && (
                              <div className="mt-2 p-2 rounded bg-muted/30 font-mono text-xs text-muted-foreground">
                                Input: {JSON.stringify(step.toolInput as Record<string, unknown>, null, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {task.status === "running" ? (
                      <div className="flex items-center justify-center gap-2">
                        <Activity className="w-4 h-4 animate-pulse text-blue-400" />
                        Executing...
                      </div>
                    ) : "No execution steps recorded"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Final Output */}
            {task.output && (
              <Card className="bg-white border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Final Output
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <Streamdown>{task.output}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {task.errorMessage && (
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-destructive mb-1">Task Failed</div>
                      <div className="text-xs text-muted-foreground font-mono">{task.errorMessage}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Task not found</div>
        )}
      </div>
    </FutureDashboardLayout>
  );
}
