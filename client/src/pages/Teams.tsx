import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Users, Plus, UserPlus, Crown, Shield, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Teams() {
  const { data: teams, isLoading, refetch } = trpc.teams.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");

  const createMutation = trpc.teams.create.useMutation({
    onSuccess: () => { toast.success("Team created!"); refetch(); setShowCreate(false); setTeamName(""); },
    onError: (e) => toast.error(e.message),
  });

  const ROLE_ICONS: Record<string, typeof Crown> = { owner: Crown, admin: Shield, member: User, viewer: User };
  const ROLE_COLORS: Record<string, string> = {
    owner: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    admin: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    member: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    viewer: "text-muted-foreground bg-muted border-border",
  };

  return (
    <FutureDashboardLayout title="Teams" subtitle="Collaborate with your team on agents">
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div />
          <Button onClick={() => setShowCreate(true)} className="glow-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-32 bg-card/50 rounded-xl border border-border/50 animate-pulse" />)}</div>
        ) : teams && teams.length > 0 ? (
          <div className="space-y-4">
            {teams.map(({ team, member }) => {
              const role = member.role;
              const RoleIcon = ROLE_ICONS[role] ?? User;
              return (
                <Card key={team.id} className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{team.name}</CardTitle>
                          <div className="text-xs text-muted-foreground">/{team.slug}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs flex items-center gap-1 ${ROLE_COLORS[role] ?? ROLE_COLORS.member}`}>
                        <RoleIcon className="w-3 h-3" />
                        {role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Created {new Date(team.createdAt).toLocaleDateString()}
                      </div>
                      {(role === "owner" || role === "admin") && (
                        <Button variant="outline" size="sm" className="h-7 text-xs"
                          onClick={() => toast.info("Team management coming soon")}>
                          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                          Invite Member
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">No teams yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Create a team to collaborate with others on building and managing AI agents.
            </p>
            <Button onClick={() => setShowCreate(true)} className="glow-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Team Name</Label>
              <Input placeholder="e.g. Acme Corp" value={teamName}
                onChange={e => setTeamName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createMutation.mutate({ name: teamName })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate({ name: teamName })}
                disabled={!teamName.trim() || createMutation.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FutureDashboardLayout>
  );
}
