import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import {
  Bot, Save, Rocket, Globe, Lock, Search, Code2, FileUp, Webhook,
  Brain, Thermometer, ChevronRight, Sparkles, Copy, ExternalLink,
  MessageSquare, Play, ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import AgentChatPanel from "@/components/AgentChatPanel";

const MODELS = [
  { id: "future-agent-1", name: "Future-1 Ultra", provider: "Future AI", tier: "ultra", desc: "Fully autonomous: browses the web, executes code, manages files, and completes complex multi-step tasks end-to-end" },
  { id: "gpt-4o", name: "Future-1 Pro", provider: "Future AI", tier: "premium", desc: "Multimodal, fast, great for complex reasoning and deep analysis" },
  { id: "gpt-4o-mini", name: "Future-1 Mini", provider: "Future AI", tier: "standard", desc: "Fastest and most cost-effective model for everyday tasks" },
  { id: "claude-3-5-sonnet-20241022", name: "Future-1 Code", provider: "Future AI", tier: "premium", desc: "Exceptional at coding, analysis, and nuanced reasoning tasks" },
  { id: "claude-3-haiku-20240307", name: "Future-1 Fast", provider: "Future AI", tier: "standard", desc: "Lightning-fast responses for simple tasks and high-volume use" },
];

const TIER_COLORS: Record<string, string> = {
  standard: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  premium: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  ultra: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30",
};

export default function AgentBuilder() {
  const params = useParams<{ id: string }>();
  const agentId = params.id ? parseInt(params.id) : undefined;
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"build" | "test">("build");

  const { data: existingAgent } = trpc.agents.get.useQuery(
    { id: agentId! },
    { enabled: !!agentId }
  );

  const [form, setForm] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    modelId: "future-agent-1",
    memoryEnabled: false,
    isPublic: false,
    isDeployed: false,
    webSearchEnabled: false,
    codeExecutionEnabled: false,
    fileUploadEnabled: false,
    apiCallsEnabled: false,
    temperature: 0.7,
    maxSteps: 10,
  });

  useEffect(() => {
    if (existingAgent) {
      setForm({
        name: existingAgent.name,
        description: existingAgent.description ?? "",
        systemPrompt: existingAgent.systemPrompt,
        modelId: existingAgent.modelId,
        memoryEnabled: existingAgent.memoryEnabled,
        isPublic: existingAgent.isPublic,
        isDeployed: existingAgent.isDeployed,
        webSearchEnabled: existingAgent.webSearchEnabled,
        codeExecutionEnabled: existingAgent.codeExecutionEnabled,
        fileUploadEnabled: existingAgent.fileUploadEnabled,
        apiCallsEnabled: existingAgent.apiCallsEnabled,
        temperature: existingAgent.temperature,
        maxSteps: existingAgent.maxSteps,
      });
    }
  }, [existingAgent]);

  const createMutation = trpc.agents.create.useMutation({
    onSuccess: (agent) => {
      toast.success("Agent created!");
      navigate(`/dashboard/agents/${agent.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.agents.update.useMutation({
    onSuccess: () => toast.success("Agent saved!"),
    onError: (e) => toast.error(e.message),
  });

  const deployMutation = trpc.agents.deploy.useMutation({
    onSuccess: (data) => {
      toast.success(form.isDeployed ? "Agent undeployed" : "Agent deployed! Shareable link ready.");
      setForm(f => ({ ...f, isDeployed: !f.isDeployed }));
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Agent name is required"); return; }
    if (!form.systemPrompt.trim()) { toast.error("System prompt is required"); return; }
    if (agentId) {
      updateMutation.mutate({ id: agentId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDeploy = () => {
    if (!agentId) { toast.error("Save the agent first"); return; }
    deployMutation.mutate({ id: agentId, isDeployed: !form.isDeployed });
  };

  const publicUrl = agentId && existingAgent ? `${window.location.origin}/agent/${existingAgent.slug}` : null;

  return (
    <FutureDashboardLayout
      title={agentId ? "Edit Agent" : "New Agent"}
      subtitle={agentId ? existingAgent?.name : "Configure your autonomous AI agent"}>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border/50 bg-background/30 flex-shrink-0">
          <Link href="/dashboard/agents">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Agents
            </Button>
          </Link>

          <div className="flex items-center gap-1 ml-2">
            <Button
              variant={activeTab === "build" ? "secondary" : "ghost"}
              size="sm" className="h-7 text-xs"
              onClick={() => setActiveTab("build")}>
              <Bot className="w-3.5 h-3.5 mr-1.5" />
              Build
            </Button>
            <Button
              variant={activeTab === "test" ? "secondary" : "ghost"}
              size="sm" className="h-7 text-xs"
              onClick={() => setActiveTab("test")}
              disabled={!agentId}>
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Test
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {form.isDeployed && publicUrl && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-mono truncate max-w-48">{publicUrl}</span>
                <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Copied!"); }}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
            {agentId && (
              <Button size="sm" className={`h-8 text-xs ${form.isDeployed ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/20" : "glow-primary"}`}
                onClick={handleDeploy} disabled={deployMutation.isPending}>
                <Rocket className="w-3.5 h-3.5 mr-1.5" />
                {form.isDeployed ? "Undeploy" : "Deploy"}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === "build" ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Basic Info */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    Agent Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Name *</Label>
                    <Input placeholder="e.g. Research Assistant" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-input/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
                    <Input placeholder="What does this agent do?" value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="bg-input/50" />
                  </div>
                </CardContent>
              </Card>

              {/* System Prompt */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-400" />
                    System Prompt *
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define your agent's personality, capabilities, and behavior.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="You are an expert research assistant. When given a task, you:
1. Break it down into clear steps
2. Search for relevant information
3. Synthesize findings into a comprehensive response
4. Always cite your sources

Be thorough, accurate, and helpful."
                    value={form.systemPrompt}
                    onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
                    className="min-h-[180px] font-mono text-sm bg-input/50 resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{form.systemPrompt.length} characters</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-primary"
                      onClick={() => setForm(f => ({ ...f, systemPrompt: "You are a helpful AI assistant. Answer questions clearly and concisely. When you need to research something, use the available tools to find accurate information." }))}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Use template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Model Selection */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Model
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    {MODELS.map((model) => (
                      <div key={model.id}
                        onClick={() => setForm(f => ({ ...f, modelId: model.id }))}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          form.modelId === model.id
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/50 hover:border-border hover:bg-accent/30"
                        }`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          form.modelId === model.id ? "border-primary" : "border-muted-foreground/30"
                        }`}>
                          {form.modelId === model.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{model.name}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${TIER_COLORS[model.tier]}`}>
                              {model.tier}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{model.provider} · {model.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5" />
                        Temperature: {form.temperature}
                      </Label>
                    </div>
                    <Slider
                      value={[form.temperature]}
                      onValueChange={([v]) => setForm(f => ({ ...f, temperature: v! }))}
                      min={0} max={2} step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Max Steps: {form.maxSteps}
                    </Label>
                    <Slider
                      value={[form.maxSteps]}
                      onValueChange={([v]) => setForm(f => ({ ...f, maxSteps: v! }))}
                      min={1} max={50} step={1}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tools */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    Tool Integrations
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Enable capabilities your agent can use during task execution.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "webSearchEnabled", icon: Search, label: "Web Search", desc: "Search the internet for real-time information", color: "text-blue-400" },
                    { key: "codeExecutionEnabled", icon: Code2, label: "Code Execution", desc: "Write and run Python/JavaScript code", color: "text-emerald-400" },
                    { key: "fileUploadEnabled", icon: FileUp, label: "File Upload", desc: "Process and analyze uploaded files", color: "text-orange-400" },
                    { key: "apiCallsEnabled", icon: Webhook, label: "API Calls", desc: "Make HTTP requests to external APIs", color: "text-pink-400" },
                    { key: "memoryEnabled", icon: Brain, label: "Memory", desc: "Remember context across conversations", color: "text-violet-400" },
                  ].map((tool) => (
                    <div key={tool.key} className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-accent/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <tool.icon className={`w-4 h-4 ${tool.color}`} />
                        <div>
                          <div className="text-sm font-medium">{tool.label}</div>
                          <div className="text-xs text-muted-foreground">{tool.desc}</div>
                        </div>
                      </div>
                      <Switch
                        checked={form[tool.key as keyof typeof form] as boolean}
                        onCheckedChange={(v) => setForm(f => ({ ...f, [tool.key]: v }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Visibility */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Visibility & Sharing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                    <div className="flex items-center gap-3">
                      {form.isPublic ? <Globe className="w-4 h-4 text-cyan-400" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <div className="text-sm font-medium">{form.isPublic ? "Public" : "Private"}</div>
                        <div className="text-xs text-muted-foreground">
                          {form.isPublic ? "Anyone with the link can use this agent" : "Only you can access this agent"}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={form.isPublic}
                      onCheckedChange={(v) => setForm(f => ({ ...f, isPublic: v }))}
                    />
                  </div>
                  {agentId && existingAgent && form.isDeployed && (
                    <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                      <div className="text-xs text-muted-foreground mb-1.5">Shareable link</div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-emerald-400 flex-1 truncate">
                          {window.location.origin}/agent/{existingAgent.slug}
                        </code>
                        <Button variant="ghost" size="icon" className="w-6 h-6 flex-shrink-0"
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/agent/${existingAgent.slug}`); toast.success("Copied!"); }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <a href={`/agent/${existingAgent.slug}`} target="_blank">
                          <Button variant="ghost" size="icon" className="w-6 h-6 flex-shrink-0">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            {agentId && <AgentChatPanel agentId={agentId} />}
          </div>
        )}
      </div>
    </FutureDashboardLayout>
  );
}
