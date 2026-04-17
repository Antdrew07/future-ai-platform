import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Users, Plus, UserPlus, Crown, Shield, User, Loader2, Mail } from "lucide-react";

const ROLE_ICONS: Record<string, typeof Crown> = { owner: Crown, admin: Shield, member: User, viewer: User };
const ROLE_COLORS: Record<string, string> = {
  owner: "text-amber-600 bg-amber-50 border-amber-200",
  admin: "text-violet-600 bg-violet-50 border-violet-200",
  member: "text-blue-600 bg-blue-50 border-blue-200",
  viewer: "text-muted-foreground bg-muted border-border",
};

export default function Teams() {
  const { data: teams, isLoading, refetch } = trpc.teams.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");

  const createMutation = trpc.teams.create.useMutation({
    onSuccess: () => { toast.success("Team created!"); refetch(); setShowCreate(false); setTeamName(""); },
    onError: (e) => toast.error(e.message),
  });

  const inviteMutation = trpc.teams.invite.useMutation({
    onSuccess: () => {
      toast.success(`Invite sent to ${inviteEmail}!`);
      setShowInvite(false);
      setInviteEmail("");
      setInviteRole("member");
      setInviteTeamId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleOpenInvite = (teamId: number) => {
    setInviteTeamId(teamId);
    setShowInvite(true);
  };

  const handleSendInvite = () => {
    if (!inviteTeamId || !inviteEmail.trim()) return;
    inviteMutation.mutate({ teamId: inviteTeamId, email: inviteEmail.trim(), role: inviteRole });
  };

  return (
    <FutureDashboardLayout title="Teams" subtitle="Collaborate with your team on agents">
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{(teams ?? []).length} team{(teams ?? []).length !== 1 ? "s" : ""}</p>
          <Button onClick={() => setShowCreate(true)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Team
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-muted rounded-xl h-28 animate-pulse border border-border" />)}</div>
        ) : teams && teams.length > 0 ? (
          <div className="space-y-4">
            {teams.map(({ team, member }) => {
              const role = member.role;
              const RoleIcon = ROLE_ICONS[role] ?? User;
              return (
                <div key={team.id} className="bg-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-foreground">{team.name}</h3>
                        <div className="text-xs text-muted-foreground">/{team.slug}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] flex items-center gap-1 border ${ROLE_COLORS[role] ?? ROLE_COLORS.member}`}>
                      <RoleIcon className="w-3 h-3" />
                      {role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(team.createdAt).toLocaleDateString()}
                    </div>
                    {(role === "owner" || role === "admin") && (
                      <Button variant="outline" size="sm" className="h-7 text-xs border-border bg-white hover:bg-accent text-foreground"
                        onClick={() => handleOpenInvite(team.id)}>
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
            <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-foreground mb-1">No teams yet</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs text-center">
              Create a team to collaborate with others on building and managing AI agents.
            </p>
            <Button onClick={() => setShowCreate(true)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create Your First Team
            </Button>
          </div>
        )}

        {/* Create Team Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="bg-white border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">Create Team</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Team Name</Label>
              <Input placeholder="e.g. Acme Corp" value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="bg-background border-border text-foreground"
                onKeyDown={e => e.key === "Enter" && teamName.trim() && createMutation.mutate({ name: teamName })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="border-border bg-white text-foreground hover:bg-accent">Cancel</Button>
              <Button onClick={() => createMutation.mutate({ name: teamName })}
                disabled={!teamName.trim() || createMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite Member Dialog */}
        <Dialog open={showInvite} onOpenChange={(open) => { setShowInvite(open); if (!open) { setInviteEmail(""); setInviteRole("member"); } }}>
          <DialogContent className="bg-white border-border">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Invite Team Member
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="bg-background border-border text-foreground"
                  onKeyDown={e => e.key === "Enter" && inviteEmail.trim() && handleSendInvite()}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member" | "viewer")}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — Can manage team and invite members</SelectItem>
                    <SelectItem value="member">Member — Can view and use agents</SelectItem>
                    <SelectItem value="viewer">Viewer — Read-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvite(false)} className="border-border bg-white text-foreground hover:bg-accent">Cancel</Button>
              <Button
                onClick={handleSendInvite}
                disabled={!inviteEmail.trim() || inviteMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FutureDashboardLayout>
  );
}
