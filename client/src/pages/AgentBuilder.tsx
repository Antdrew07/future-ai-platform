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
  { id: "future-agent-1", name: "Future-1 Ultra", provider: "Future AI", tier: "ultra", badge: "⚡ Default", desc: "Fully autonomous: browses the web, executes code, manages files, and completes complex multi-step tasks end-to-end", tags: ["Autonomous", "Code", "Research"] },
  { id: "claude-opus-4-5", name: "Future-1 Opus", provider: "Anthropic", tier: "ultra", badge: "🏆 Most Intelligent", desc: "Claude Opus — Anthropic's most powerful model for the hardest problems and deepest analysis", tags: ["Deep Reasoning", "Analysis", "200K ctx"] },
  { id: "gpt-4o", name: "Future-1 Pro", provider: "OpenAI", tier: "premium", badge: "🧠 Reasoning", desc: "GPT-4o — multimodal, fast, best all-around reasoning with vision support", tags: ["Vision", "Reasoning", "Code"] },
  { id: "claude-3-5-sonnet-20241022", name: "Future-1 Code", provider: "Anthropic", tier: "premium", badge: "💻 Best for Code", desc: "Claude 3.5 Sonnet — best-in-class for coding, debugging, and technical analysis", tags: ["Code", "Analysis", "200K ctx"] },
  { id: "sonar-pro", name: "Future Search Pro", provider: "Perplexity", tier: "premium", badge: "🔍 Live Search", desc: "Perplexity Sonar Pro — real-time web search with citations. Best for research and current events", tags: ["Web Search", "Real-time", "Citations"] },
  { id: "gemini-1.5-pro", name: "Future-1 Long", provider: "Google", tier: "premium", badge: "📚 1M Context", desc: "Gemini 1.5 Pro — 1 million token context window for massive documents, codebases, and long research", tags: ["1M Context", "Vision", "Long Docs"] },
  { id: "gemini-2.0-flash", name: "Future-1 Flash", provider: "Google", tier: "standard", badge: "🚀 Gemini 2.0", desc: "Gemini 2.0 Flash — Google's latest model, blazing fast with excellent quality", tags: ["Fast", "Vision", "Multimodal"] },
  { id: "sonar", name: "Future Search", provider: "Perplexity", tier: "standard", badge: "🌐 Web Search", desc: "Perplexity Sonar — fast real-time web search for up-to-date information", tags: ["Web Search", "Real-time"] },
  { id: "llama-3.3-70b-versatile", name: "Future-1 Speed", provider: "Groq", tier: "standard", badge: "🦙 Open Source", desc: "Llama 3.3 70B on Groq — fastest inference available, open-source model with strong reasoning", tags: ["Ultra Fast", "Open Source"] },
  { id: "gpt-4o-mini", name: "Future-1 Mini", provider: "OpenAI", tier: "standard", badge: "💨 Fast", desc: "GPT-4o Mini — fastest and most cost-effective for everyday tasks", tags: ["Fast", "Affordable"] },
  { id: "claude-haiku-4-5", name: "Future-1 Fast", provider: "Anthropic", tier: "standard", badge: "⚡ Ultra Fast", desc: "Claude Haiku — lightning-fast responses for simple tasks and high-volume use", tags: ["Fast", "Chat"] },
  { id: "llama-3.1-8b-instant", name: "Future-1 Instant", provider: "Groq", tier: "standard", badge: "⚡ Instant", desc: "Llama 3.1 8B on Groq — near-instant responses for simple tasks", tags: ["Instant", "Chat"] },
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
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border/30 glass-strong flex-shrink-0">
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
              <div className="glass rounded-xl overflow-hidden">
                <div className="px-5 pt-5 pb-2">
                  <h3 className="text-sm font-heading font-semibold flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    Agent Identity
                  </h3>
                </div>
                <div className="px-5 pb-5 space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Name *</Label>
                    <Input placeholder="e.g. Research Assistant" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-input/50 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
                    <Input placeholder="What does this agent do?" value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="bg-input/50 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* System Prompt */}
              <div className="glass rounded-xl overflow-hidden">
                <div className="px-5 pt-5 pb-2">
                  <h3 className="text-sm font-heading font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-400" />
                    System Prompt *
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Define your agent's personality, capabilities, and behavior.
                  </p>
                </div>
                <div className="px-5 pb-5">
                  <Textarea
                    placeholder="You are an expert research assistant. When given a task, you:
1. Break it down into clear steps
2. Search for relevant information
3. Synthesize findings into a comprehensive response
4. Always cite your sources

Be thorough, accurate, and helpful."
                    value={form.systemPrompt}
                    onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
                    className="min-h-[180px] font-mono text-sm bg-input/50 resize-none rounded-xl"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{form.systemPrompt.length} characters</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-primary"
                      onClick={() => setForm(f => ({ ...f, systemPrompt: "You are a helpful AI assistant. Answer questions clearly and concisely. When you need to research something, use the available tools to find accurate information." }))}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Use template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Model Selection */}
              <div className="glass rounded-xl overflow-hidden">
                <div className="px-5 pt-5 pb-2">
                  <h3 className="text-sm font-heading font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Model
                  </h3>
                </div>
                <div className="px-5 pb-5 space-y-4">
                  <div className="grid gap-2">
                    {MODELS.map((model) => (
                      <div key={model.id}
                        onClick={() => setForm(f => ({ ...f, modelId: model.id }))}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          form.modelId === model.id
                            ? "border-primary/40 bg-primary/5 glow-subtle"
                            : "border-border/30 hover:border-border/50 hover:bg-accent/30"
                        }`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          form.modelId === model.id ? "border-primary" : "border-muted-foreground/30"
                        }`}>
                          {form.modelId === model.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{model.name}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${TIER_COLORS[model.tier]}`}>
                              {model.tier}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{model.badge}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{model.provider} · {model.desc}</div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(model as typeof model & { tags?: string[] }).tags?.map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/50 text-muted-foreground border border-border/30">{tag}</span>
                            ))}
                          </div>
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
                </div>
              </div>

              {/* Tools */}
              <div className="glass rounded-xl overflow-hidden">
                <div className="px-5 pt-5 pb-2">
                  <h3 className="text-sm font-heading font-semibold flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    Tool Integrations
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Enable capabilities your agent can use during task execution.
                  </p>
                </div>
                <div className="px-5 pb-5 space-y-3">
                  {[
                    { key: "webSearchEnabled", icon: Search, label: "Web Search", desc: "Search the internet for real-time information", color: "text-blue-400" },
                    { key: "codeExecutionEnabled", icon: Code2, label: "Code Execution", desc: "Write and run Python/JavaScript code", color: "text-emerald-400" },
                    { key: "fileUploadEnabled", icon: FileUp, label: "File Upload", desc: "Process and analyze uploaded files", color: "text-orange-400" },
                    { key: "apiCallsEnabled", icon: Webhook, label: "API Calls", desc: "Make HTTP requests to external APIs", color: "text-pink-400" },
                    { key: "memoryEnabled", icon: Brain, label: "Memory", desc: "Remember context across conversations", color: "text-violet-400" },
                  ].map((tool) => (
                    <div key={tool.key} className="flex items-center justify-between p-3 rounded-xl border border-border/20 hover:bg-accent/30 transition-all duration-200">
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
                </div>
              </div>

              {/* Visibility */}
              <div className="glass rounded-xl overflow-hidden">
                <div className="px-5 pt-5 pb-2">
                  <h3 className="text-sm font-heading font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Visibility & Sharing
                  </h3>
                </div>
                <div className="px-5 pb-5 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/20">
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
                    <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
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
                </div>
              </div>
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
