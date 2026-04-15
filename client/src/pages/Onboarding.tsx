/**
 * Future AI Platform — Onboarding Flow
 * 
 * Guides new users through:
 * 1. Welcome + platform overview
 * 2. Create their first agent
 * 3. Run their first task
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sparkles, Bot, Zap, Globe, Code2, Brain, ArrowRight,
  CheckCircle2, ChevronRight, Terminal, Cpu, Play
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Welcome to Future", icon: Sparkles },
  { id: 2, title: "Create Your First Agent", icon: Bot },
  { id: 3, title: "You're Ready!", icon: CheckCircle2 },
];

const TEMPLATE_AGENTS = [
  {
    name: "Research Assistant",
    description: "Searches the web, synthesizes information, and writes comprehensive reports on any topic.",
    prompt: "You are a research assistant. When given a topic, search the web thoroughly, gather information from multiple sources, and produce a well-structured, comprehensive report with citations.",
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    tools: ["web_search", "write_file"],
  },
  {
    name: "Code Engineer",
    description: "Writes, debugs, and executes code in Python, JavaScript, and more.",
    prompt: "You are an expert software engineer. Write clean, well-documented code, explain your approach, and execute it to verify correctness. Handle errors gracefully.",
    icon: Code2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    tools: ["code_execute", "write_file"],
  },
  {
    name: "Data Analyst",
    description: "Analyzes datasets, finds patterns, and generates insights with visualizations.",
    prompt: "You are a data analyst. Analyze data thoroughly, identify patterns and trends, and present findings clearly with actionable insights.",
    icon: Brain,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    tools: ["code_execute", "analyze_data"],
  },
  {
    name: "Custom Agent",
    description: "Start from scratch and define your own agent's capabilities.",
    prompt: "",
    icon: Terminal,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    tools: [],
  },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATE_AGENTS[0] | null>(null);
  const [agentName, setAgentName] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [createdAgentId, setCreatedAgentId] = useState<number | null>(null);

  const createAgent = trpc.agents.create.useMutation({
    onSuccess: (agent) => {
      setCreatedAgentId(agent.id);
      setStep(3);
    },
    onError: (err) => {
      toast.error("Failed to create agent: " + err.message);
    },
  });

  const handleSelectTemplate = (template: typeof TEMPLATE_AGENTS[0]) => {
    setSelectedTemplate(template);
    if (template.name !== "Custom Agent") {
      setAgentName(template.name);
      setAgentPrompt(template.prompt);
    } else {
      setAgentName("");
      setAgentPrompt("");
    }
  };

  const handleCreateAgent = () => {
    if (!agentName.trim()) {
      toast.error("Please enter an agent name");
      return;
    }
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Future</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
          Skip for now
        </Button>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-3 py-6 px-4">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 ${step >= s.id ? "text-foreground" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s.id
                  ? "bg-primary text-primary-foreground"
                  : step === s.id
                  ? "bg-primary/20 border-2 border-primary text-primary"
                  : "bg-muted border border-border text-muted-foreground"
              }`}>
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              <span className="hidden sm:block text-sm font-medium">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 ${step > s.id ? "bg-primary" : "bg-border"}`} />
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
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center mx-auto shadow-2xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-black tracking-tight">
                  Welcome to <span className="gradient-text">Future</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Build autonomous AI agents powered by GPT-4o and Claude that can browse the web, write code, manage files, and complete complex tasks — all on your behalf.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Globe, label: "Web Search", color: "text-blue-400", bg: "bg-blue-500/10" },
                  { icon: Code2, label: "Code Execution", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { icon: Cpu, label: "Multi-Model AI", color: "text-violet-400", bg: "bg-violet-500/10" },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl border border-border/50 bg-card/50 text-center">
                    <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mx-auto mb-2`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" className="h-12 px-10 text-base font-semibold glow-primary" onClick={() => setStep(2)}>
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Create Agent */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Create Your First Agent</h2>
                <p className="text-muted-foreground">Choose a template or start from scratch</p>
              </div>

              {/* Template Selection */}
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATE_AGENTS.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => handleSelectTemplate(template)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      selectedTemplate?.name === template.name
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${template.bg} flex items-center justify-center mb-3`}>
                      <template.icon className={`w-4 h-4 ${template.color}`} />
                    </div>
                    <div className="font-semibold text-sm mb-1">{template.name}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {template.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Agent Config */}
              {selectedTemplate && (
                <div className="space-y-4 p-5 rounded-xl border border-border/50 bg-card/30">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Agent Name</label>
                    <Input
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="My Research Assistant"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">System Instructions</label>
                    <Textarea
                      value={agentPrompt}
                      onChange={(e) => setAgentPrompt(e.target.value)}
                      placeholder="Describe what your agent should do and how it should behave..."
                      rows={4}
                      className="bg-background/50 resize-none font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-2xl">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-black tracking-tight">
                  Your Agent is <span className="gradient-text">Ready!</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  <strong className="text-foreground">{agentName}</strong> has been created and deployed. Give it a task and watch it work autonomously.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border/50 bg-card/30 text-left space-y-3">
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Try asking your agent:</div>
                {[
                  "Research the latest developments in quantum computing and write a report",
                  "Write a Python script to analyze a CSV file and generate charts",
                  "Search for the top 10 AI startups in 2025 and summarize their products",
                ].map((suggestion) => (
                  <div key={suggestion} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{suggestion}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="flex-1 h-12 glow-primary"
                  onClick={() => navigate(createdAgentId ? `/workspace/${createdAgentId}` : "/dashboard")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Launch Agent Workspace
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12"
                  onClick={() => navigate("/dashboard")}
                >
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
