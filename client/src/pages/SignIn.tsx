import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowRight, Loader2, Smartphone, Globe, Briefcase, Code2 } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029617589/m5GbkNTBEjcM6aS7UZa8ie/future-logo_dd9d650b.png";

export default function SignIn() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => navigate("/dashboard"),
    onError: (err) => setError(err.message || "Invalid email or password"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields"); return; }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand gradient panel */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0d0620 0%, #1a0a3c 25%, #2d1b69 55%, #1a3a8f 100%)" }}
      >
        {/* Gold shimmer */}
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 85% 15%, #C9A84C 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, #7B2FFF 0%, transparent 50%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src={LOGO_URL} alt="Future" className="w-12 h-12 object-contain drop-shadow-lg" />
          <span className="text-white font-heading font-bold text-2xl tracking-tight">Future</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-5">
          <h1 className="text-4xl font-heading font-bold text-white leading-tight">
            Your personal AI<br />
            <span style={{ background: "linear-gradient(90deg, #C9A84C, #f0d080, #C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              is waiting for you.
            </span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            Tell me what you want. I'll do the work for you — apps, books, websites, businesses, and more.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { icon: Smartphone, label: "iOS & Android apps" },
              { icon: Globe, label: "Websites" },
              { icon: Briefcase, label: "Launch businesses" },
              { icon: Code2, label: "Write code" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 text-white/80 border border-white/15">
                <Icon className="w-3 h-3 text-yellow-300" />{label}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/25 text-xs">© 2026 Future AI. All rights reserved.</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <img src={LOGO_URL} alt="Future" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">Future</span>
          </div>

          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Welcome back — I missed you.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-11 bg-white border-border focus:border-primary/50 rounded-xl shadow-sm"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/80">Password</label>
                <a href="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-11 bg-white border-border focus:border-primary/50 rounded-xl shadow-sm pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/8 border border-destructive/15 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200"
            >
              {loginMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Sign in</span><ArrowRight className="w-4 h-4 ml-1.5" /></>
              }
            </Button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground">New to Future?</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <Link href="/signup">
            <Button variant="outline" className="w-full h-11 rounded-xl border-border bg-white hover:bg-accent/40 text-foreground font-medium shadow-sm">
              Create a free account
            </Button>
          </Link>

          <p className="text-center text-xs text-muted-foreground/50">
            By signing in you agree to our{" "}
            <span className="text-primary/60 hover:text-primary cursor-pointer transition-colors">Terms</span>{" "}
            and{" "}
            <span className="text-primary/60 hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
