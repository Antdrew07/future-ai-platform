import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Link } from "wouter";
import { Sparkles, Bot, Globe } from "lucide-react";
import AgentChatPanel from "@/components/AgentChatPanel";
import { Badge } from "@/components/ui/badge";

export default function AgentPublic() {
  const params = useParams<{ slug: string }>();
  const { data: agent, isLoading } = trpc.agents.getBySlug.useQuery({ slug: params.slug ?? "" });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Agent not found</h2>
          <p className="text-muted-foreground">This agent doesn't exist or is not public.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm truncate">{agent.name}</h1>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <Globe className="w-2.5 h-2.5 mr-1" />Public
            </Badge>
          </div>
          {agent.description && <p className="text-xs text-muted-foreground truncate">{agent.description}</p>}
        </div>
        <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Powered by Future
        </Link>
      </header>
      <div className="flex-1 overflow-hidden">
        <AgentChatPanel agentId={agent.id} isPublic={true} />
      </div>
    </div>
  );
}
