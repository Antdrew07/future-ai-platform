import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  Bot, Plus, Settings, Play, Globe, Lock, Zap, MoreHorizontal,
  Trash2, Copy, ExternalLink, Sparkles
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function AgentList() {
  const [, navigate] = useLocation();
  const { data: agents, isLoading, refetch } = trpc.agents.list.useQuery();
  const deployMutation = trpc.agents.deploy.useMutation({
    onSuccess: () => { toast.success("Agent deployment status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.agents.delete.useMutation({
    onSuccess: () => { toast.success("Agent deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const MODEL_LABELS: Record<string, string> = {
    "gpt-4o": "Future-1 Pro",
    "gpt-4o-mini": "Future-1 Mini",
    "claude-3-5-sonnet-20241022": "Future-1 Code",
    "claude-3-haiku-20240307": "Future-1 Fast",
    "future-agent-1": "Future-1 Ultra",
  };

  return (
    <FutureDashboardLayout title="My Agents" subtitle="Create and manage your AI agents">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div />
          <Link href="/dashboard/agents/new">
            <Button className="glow-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-xl bg-card/50 border border-border/50 animate-pulse" />
            ))}
          </div>
        ) : agents && agents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-200 group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.isDeployed ? (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                          Live
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/agents/${agent.id}`} className="flex items-center gap-2">
                              <Settings className="w-3.5 h-3.5" /> Edit Agent
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/agent/${agent.slug}`);
                            toast.success("Link copied!");
                          }}>
                            <Copy className="w-3.5 h-3.5 mr-2" /> Copy Link
                          </DropdownMenuItem>
                          {agent.isDeployed && (
                            <DropdownMenuItem asChild>
                              <a href={`/agent/${agent.slug}`} target="_blank" className="flex items-center gap-2">
                                <ExternalLink className="w-3.5 h-3.5" /> Open Public Page
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deployMutation.mutate({ id: agent.id, isDeployed: !agent.isDeployed })}
                            className={agent.isDeployed ? "text-yellow-400" : "text-emerald-400"}>
                            <Play className="w-3.5 h-3.5 mr-2" />
                            {agent.isDeployed ? "Undeploy" : "Deploy"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { if (confirm("Delete this agent?")) deleteMutation.mutate({ id: agent.id }); }}
                            className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <Link href={`/dashboard/agents/${agent.id}`}>
                    <h3 className="font-semibold text-sm mb-1 hover:text-primary transition-colors cursor-pointer">
                      {agent.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {agent.description || agent.systemPrompt.slice(0, 80) + "..."}
                  </p>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {MODEL_LABELS[agent.modelId] ?? agent.modelId}
                        </Badge>
                        {agent.isPublic ? (
                          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        {agent.totalRuns} runs
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
                      onClick={() => navigate(`/workspace/${agent.id}`)}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Launch Workspace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Create your first agent</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Build an autonomous AI agent that can search the web, execute code, and complete complex tasks.
            </p>
            <Link href="/dashboard/agents/new">
              <Button className="glow-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </Link>
          </div>
        )}
      </div>
    </FutureDashboardLayout>
  );
}
