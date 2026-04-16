import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sparkles, Bot, Zap, Globe, Code2, Brain, ArrowRight,
  CheckCircle2, Terminal, Cpu, Play, Rocket
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Welcome", icon: Sparkles },
  { id: 2, title: "Create Agent", icon: Bot },
  { id: 3, title: "Ready", icon: CheckCircle2 },
];

const TEMPLATE_AGENTS = [
  { name: "Research Assistant", description: "Searches the web, synthesizes information, and writes comprehensive reports.", prompt: "You are a research assistant. When given a topic, search the web thoroughly, gather information from multiple sources, and produce a well-structured, comprehensive report with citations.", icon: Globe, gradient: "from-blue-500/20 to-cyan-500/20", tools: ["web_search", "write_file"] },
  { name: "Code Engineer", description: "Writes, debugs, and executes code in Python, JavaScript, and more.", prompt: "You are an expert software engineer. Write clean, well-documented code, explain your approach, and execute it to verify correctness.", icon: Code2, gradient: "from-emerald-500/20 to-green-500/20", tools: ["code_execute", "write_file"] },
  { name: "Data Analyst", description: "Analyzes datasets, finds patterns, and generates insights with visualizations.", prompt: "You are a data analyst. Analyze data thoroughly, identify patterns and trends, and present findings clearly with actionable insights.", icon: Brain, gradient: "from-violet-500/20 to-purple-500/20", tools: ["code_execute", "analyze_data"] },
  { name: "Custom Agent", description: "Start from scratch and define your own capabilities.", prompt: "", icon: Terminal, gradient: "from-orange-500/20 to-amber-500/20", tools: [] },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATE_AGENTS[0] | null>(null);
  const [agentName, setAgentName] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [createdAgentId, setCreatedAgentId] = useState<number | null>(null);

  const createAgent = trpc.agents.create.useMutation({
    onSuccess: (agent) => { setCreatedAgentId(agent.id); setStep(3); },
    onError: (err) => toast.error("Failed to create agent: " + err.message),
  });

  const handleSelectTemplate = (template: typeof TEMPLATE_AGENTS[0]) => {
    setSelectedTemplate(template);
    if (template.name !== "Custom Agent") {
      setAgentName(template.name);
      setAgentPrompt(template.prompt);
    } else { setAgentName(""); setAgentPrompt(""); }
  };

  const handleCreateAgent = () => {
    if (!agentName.trim()) { toast.error("Please enter an agent name"); return; }
    createAgent.mutate({
      name: agentName,
      description: selectedTemplate?.description ?? "",
      systemPrompt: agentPrompt,
      modelId: "future-agent-1",
      webSearchEnabled: true,
      codeExecutionEnabled: true,
      fileUploadEnabled: true,
      apiCallsEnabled: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#06060a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-heading font-bold text-white text-sm">Future</span>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-white/40 hover:text-white" onClick={() => navigate("/dashboard")}>
          Skip for now
        </Button>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-3 py-6 px-4">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.id
                  ? "bg-gradient-to-br from-violet-500 to-blue-600 text-white"
                  : step === s.id
                  ? "ring-2 ring-violet-500/50 bg-violet-500/10 text-violet-300"
                  : "bg-white/[0.03] ring-1 ring-white/[0.06] text-white/20"
              }`}>
                {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className={`hidden sm:block text-xs font-medium ${step >= s.id ? "text-white/70" : "text-white/20"}`}>{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 rounded-full ${step > s.id ? "bg-gradient-to-r from-violet-500 to-blue-600" : "bg-white/[0.06]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mx-auto shadow-2xl shadow-violet-500/30">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">
                  Welcome to <span className="gradient-text">Future</span>
                </h1>
                <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
                  Build autonomous AI agents that can browse the web, write code, manage files, and complete complex tasks — all on your behalf.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Globe, label: "Web Search", gradient: "from-blue-500/20 to-cyan-500/20" },
                  { icon: Code2, label: "Code Execution", gradient: "from-emerald-500/20 to-green-500/20" },
                  { icon: Cpu, label: "Multi-Model AI", gradient: "from-violet-500/20 to-purple-500/20" },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-xl p-4 text-center">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-2 ring-1 ring-white/[0.06]`}>
                      <item.icon className="w-5 h-5 text-white/50" />
                    </div>
                    <span className="text-xs font-medium text-white/60">{item.label}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" className="h-11 px-10 glow-primary font-heading font-semibold" onClick={() => setStep(2)}>
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Create Agent */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading font-bold text-white">Create Your First Agent</h2>
                <p className="text-xs text-white/40">Choose a template or start from scratch</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TEMPLATE_AGENTS.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => handleSelectTemplate(template)}
                    className={`glass p-4 rounded-xl text-left transition-all duration-200 ${
                      selectedTemplate?.name === template.name
                        ? "ring-1 ring-violet-500/40 bg-violet-500/5"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center mb-3 ring-1 ring-white/[0.06]`}>
                      <template.icon className="w-4 h-4 text-white/50" />
                    </div>
                    <div className="font-heading font-semibold text-sm text-white mb-1">{template.name}</div>
                    <div className="text-[11px] text-white/30 leading-relaxed line-clamp-2">{template.description}</div>
                  </button>
                ))}
              </div>

              {selectedTemplate && (
                <div className="glass rounded-xl p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Agent Name</label>
                    <Input
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="My Research Assistant"
                      className="bg-white/[0.03] border-white/[0.06]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">System Instructions</label>
                    <Textarea
                      value={agentPrompt}
                      onChange={(e) => setAgentPrompt(e.target.value)}
                      placeholder="Describe what your agent should do..."
                      rows={4}
                      className="bg-white/[0.03] border-white/[0.06] resize-none font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-white/[0.06] bg-white/[0.02] text-white/60">
                  Back
                </Button>
                <Button
                  className="flex-1 glow-primary"
                  disabled={!selectedTemplate || !agentName.trim() || createAgent.isPending}
                  onClick={handleCreateAgent}
                >
                  {createAgent.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Create Agent
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-heading font-bold text-white">
                  You're All Set!
                </h1>
                <p className="text-sm text-white/40 max-w-md mx-auto">
                  Your first agent is ready. Launch the workspace to start running tasks.
                </p>
              </div>

              <div className="glass rounded-xl p-6 max-w-sm mx-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-white/[0.06]">
                    <Bot className="w-5 h-5 text-white/40" />
                  </div>
                  <div>
                    <div className="font-heading font-semibold text-white text-sm">{agentName}</div>
                    <div className="text-[10px] text-white/30">Future-1 Ultra</div>
                  </div>
                </div>
                <p className="text-xs text-white/30 line-clamp-2">{selectedTemplate?.description}</p>
              </div>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                {createdAgentId && (
                  <Button size="lg" className="h-11 glow-primary font-heading font-semibold" onClick={() => navigate(`/workspace/${createdAgentId}`)}>
                    <Play className="w-4 h-4 mr-2" />
                    Launch Workspace
                  </Button>
                )}
                <Button variant="outline" className="h-11 border-white/[0.06] bg-white/[0.02] text-white/60" onClick={() => navigate("/dashboard")}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
