import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Code2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ApiKeys() {
  const { data: keys, isLoading, refetch } = trpc.apiKeys.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => { setNewKey(data.key); refetch(); setNewKeyName(""); },
    onError: (e) => toast.error(e.message),
  });

  const revokeMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => { toast.success("API key revoked"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <FutureDashboardLayout title="API Keys" subtitle="Manage programmatic access to your agents">
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div />
          <Button onClick={() => setShowCreate(true)} className="glow-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {/* Usage Example */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Quick Start
            </CardTitle>
            <CardDescription className="text-xs">Use your API key to call agents programmatically</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted/30 rounded-lg p-4 text-xs font-mono text-foreground/80 overflow-auto">
{`curl -X POST https://api.future.ai/v1/agents/{agentId}/run \\
  -H "Authorization: Bearer fut_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Research AI trends for 2025"}'`}
            </pre>
          </CardContent>
        </Card>

        {/* Keys List */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Your API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />)}</div>
            ) : keys && keys.length > 0 ? (
              <div className="space-y-2">
                {keys.map((key) => (
                  <div key={key.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-accent/20 transition-colors">
                    <Key className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{key.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{key.keyPrefix}••••••••••••••••</div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${key.isActive ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" : "text-muted-foreground"}`}>
                      {key.isActive ? "Active" : "Revoked"}
                    </Badge>
                    <div className="text-xs text-muted-foreground">{new Date(key.createdAt).toLocaleDateString()}</div>
                    {key.isActive && (
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Revoke this key?")) revokeMutation.mutate({ id: key.id }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No API keys yet. Create one to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Key Name</Label>
                <Input placeholder="e.g. Production, Development" value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate({ name: newKeyName })}
                disabled={!newKeyName.trim() || createMutation.isPending}>
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Show New Key Dialog */}
        <Dialog open={!!newKey} onOpenChange={() => setNewKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                API Key Created
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Copy this key now — it will never be shown again.
              </p>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                <code className="text-xs font-mono text-primary flex-1 break-all">{newKey}</code>
                <Button variant="ghost" size="icon" className="w-7 h-7 flex-shrink-0"
                  onClick={() => { navigator.clipboard.writeText(newKey!); toast.success("Copied!"); }}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setNewKey(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FutureDashboardLayout>
  );
}
