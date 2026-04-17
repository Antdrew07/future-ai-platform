import { useState } from "react";
import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Bell, Shield, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";

export default function Settings() {
  const { user, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [displayName, setDisplayName] = useState(user?.name ?? "");

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refresh();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const handleSaveProfile = () => {
    const name = displayName.trim();
    if (!name) { toast.error("Display name cannot be empty"); return; }
    updateProfileMutation.mutate({ name });
  };

  return (
    <FutureDashboardLayout title="Settings" subtitle="Manage your account preferences">
      <div className="p-6 space-y-6 max-w-2xl">
        {/* Profile */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <h3 className="text-sm font-heading font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Profile
            </h3>
          </div>
          <div className="px-5 pb-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary ring-1 ring-primary/20">
                {(displayName || user?.name)?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div>
                <div className="font-semibold">{user?.name ?? "—"}</div>
                <div className="text-sm text-muted-foreground">{user?.email ?? "—"}</div>
              </div>
            </div>
            <Separator className="bg-border/50" />
            <div className="grid gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveProfile(); }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                <Input value={user?.email ?? ""} placeholder="your@email.com" disabled className="bg-muted/30 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed. Contact support if needed.</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending || !displayName.trim() || displayName.trim() === user?.name}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <h3 className="text-sm font-heading font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-500" />
              Notifications
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Choose what updates you receive</p>
          </div>
          <div className="px-5 pb-5 space-y-4">
            {[
              { label: "Task completions", desc: "Get notified when your agent tasks finish", default: true },
              { label: "Credit alerts", desc: "Alert when balance drops below threshold", default: true },
              { label: "New features", desc: "Product updates and new feature announcements", default: false },
              { label: "Weekly digest", desc: "Weekly summary of your usage", default: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <Switch
                  defaultChecked={item.default}
                  onCheckedChange={(checked) => {
                    toast.success(`${item.label} notifications ${checked ? "enabled" : "disabled"}`);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <h3 className="text-sm font-heading font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Security
            </h3>
          </div>
          <div className="px-5 pb-5 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <div>
                <div className="text-sm font-medium">Password</div>
                <div className="text-xs text-muted-foreground">Change your account password</div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs"
                onClick={() => navigate("/forgot-password")}>
                <LinkIcon className="w-3 h-3 mr-1.5" />
                Reset Password
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <div>
                <div className="text-sm font-medium">Two-Factor Authentication</div>
                <div className="text-xs text-muted-foreground">Add an extra layer of security — coming in a future update</div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-destructive/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <h3 className="text-sm font-heading font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </h3>
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Delete Account</div>
                <div className="text-xs text-muted-foreground">Permanently delete your account and all data</div>
              </div>
              <Button variant="destructive" size="sm" className="h-7 text-xs"
                onClick={() => toast.error("To delete your account, please contact support.")}>
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </FutureDashboardLayout>
  );
}
