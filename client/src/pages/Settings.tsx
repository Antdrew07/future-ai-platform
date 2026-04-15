import FutureDashboardLayout from "@/components/FutureDashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Bell, Shield, Palette } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { user } = useAuth();

  return (
    <FutureDashboardLayout title="Settings" subtitle="Manage your account preferences">
      <div className="p-6 space-y-6 max-w-2xl">
        {/* Profile */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
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
                <Input defaultValue={user?.name ?? ""} placeholder="Your name" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                <Input defaultValue={user?.email ?? ""} placeholder="your@email.com" disabled />
              </div>
            </div>
            <Button size="sm" onClick={() => toast.info("Profile update coming soon")}>
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              Notifications
            </CardTitle>
            <CardDescription className="text-xs">Choose what updates you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Switch defaultChecked={item.default} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div>
                <div className="text-sm font-medium">Login Method</div>
                <div className="text-xs text-muted-foreground capitalize">{user?.loginMethod ?? "OAuth"}</div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs"
                onClick={() => toast.info("Coming soon")}>
                Change
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div>
                <div className="text-sm font-medium">Two-Factor Authentication</div>
                <div className="text-xs text-muted-foreground">Add an extra layer of security</div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs"
                onClick={() => toast.info("Coming soon")}>
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Delete Account</div>
                <div className="text-xs text-muted-foreground">Permanently delete your account and all data</div>
              </div>
              <Button variant="destructive" size="sm" className="h-7 text-xs"
                onClick={() => toast.error("Contact support to delete your account")}>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </FutureDashboardLayout>
  );
}
