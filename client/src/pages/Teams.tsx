import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { Users, Plus, UserPlus, Crown, Shield, User, Loader2 } from "lucide-react";

const ROLE_ICONS: Record<string, typeof Crown> = { owner: Crown, admin: Shield, member: User, viewer: User };
const ROLE_COLORS: Record<string, string> = {
  owner: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  admin: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  member: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  viewer: "text-white/40 bg-white/[0.03] border-white/[0.06]",
};

export default function Teams() {
  const { data: teams, isLoading, refetch } = trpc.teams.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");

  const createMutation = trpc.teams.create.useMutation({
    onSuccess: () => { toast.success("Team created!"); refetch(); setShowCreate(false); setTeamName(""); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <FutureDashboardLayout title="Teams" subtitle="Collaborate with your team on agents">
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/40">{(teams ?? []).length} team{(teams ?? []).length !== 1 ? "s" : ""}</p>
          <Button onClick={() => setShowCreate(true)} size="sm" className="glow-primary text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Team
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="glass rounded-xl h-28 animate-pulse" />)}</div>
        ) : teams && teams.length > 0 ? (
          <div className="space-y-4">
            {teams.map(({ team, member }) => {
              const role = member.role;
              const RoleIcon = ROLE_ICONS[role] ?? User;
              return (
                <div key={team.id} className="glass card-hover rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-white/[0.06]">
                        <Users className="w-5 h-5 text-white/40" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-white">{team.name}</h3>
                        <div className="text-xs text-white/30">/{team.slug}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] flex items-center gap-1 border ${ROLE_COLORS[role] ?? ROLE_COLORS.member}`}>
                      <RoleIcon className="w-3 h-3" />
                      {role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/30">
                      Created {new Date(team.createdAt).toLocaleDateString()}
                    </div>
                    {(role === "owner" || role === "admin") && (
                      <Button variant="outline" size="sm" className="h-7 text-xs border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                        onClick={() => toast.info("Team management coming soon")}>
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                        Invite Member
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-4 ring-1 ring-white/[0.06]">
              <Users className="w-8 h-8 text-white/10" />
            </div>
            <h3 className="font-heading font-semibold text-white/60 mb-1">No teams yet</h3>
            <p className="text-xs text-white/30 mb-4 max-w-xs text-center">
              Create a team to collaborate with others on building and managing AI agents.
            </p>
            <Button onClick={() => setShowCreate(true)} size="sm" className="glow-primary text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create Your First Team
            </Button>
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="glass border-white/[0.06]">
            <DialogHeader>
              <DialogTitle className="font-heading">Create Team</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label className="text-xs text-white/40 mb-1.5 block">Team Name</Label>
              <Input placeholder="e.g. Acme Corp" value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="bg-white/[0.03] border-white/[0.06]"
                onKeyDown={e => e.key === "Enter" && teamName.trim() && createMutation.mutate({ name: teamName })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/[0.06]">Cancel</Button>
              <Button onClick={() => createMutation.mutate({ name: teamName })}
                disabled={!teamName.trim() || createMutation.isPending}
                className="glow-primary">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FutureDashboardLayout>
  );
}
