import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";

const ICON_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029617589/m5GbkNTBEjcM6aS7UZa8ie/future-favicon-jKAia25Lk6hjbXvQ6q4uKZ.webp";

export default function SignUp() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => navigate("/onboarding"),
    onError: (err) => setError(err.message || "Failed to create account. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("Please fill in all fields"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    registerMutation.mutate({ name, email, password });
  };

  const passwordStrength = () => {
    if (password.length === 0) return null;
    if (password.length < 8) return { label: "Too short", color: "bg-red-400", width: "w-1/4" };
    if (password.length < 12) return { label: "Fair", color: "bg-amber-400", width: "w-2/4" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: "Good", color: "bg-blue-400", width: "w-3/4" };
    return { label: "Strong", color: "bg-emerald-400", width: "w-full" };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex">
      {/* Left — violet brand panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <img src={ICON_URL} alt="Future" className="w-6 h-6" />
          </div>
          <span className="text-white font-heading font-bold text-xl tracking-tight">Future</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-5">
          <h1 className="text-4xl font-heading font-bold text-white leading-tight">
            Start building<br />AI agents<br />today — free.
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            Get 100 free credits on signup. No credit card required. Deploy your first agent in minutes.
          </p>
          {/* Social proof */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {["V", "A", "J", "M"].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-violet-600 flex items-center justify-center text-xs font-bold text-white">
                  {l}
                </div>
              ))}
            </div>
            <p className="text-white/60 text-sm">Join thousands of builders</p>
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
              <img src={ICON_URL} alt="Future" className="w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">Future</span>
          </div>

          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">Create your account</h2>
            <p className="text-sm text-muted-foreground mt-1">Start building AI agents — 100 free credits included</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Full name</label>
              <Input
                type="text"
                placeholder="Ada Lovelace"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-11 bg-white border-border focus:border-primary/50 rounded-xl shadow-sm"
                autoComplete="name"
              />
            </div>

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
              <label className="text-sm font-medium text-foreground/80">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-11 bg-white border-border focus:border-primary/50 rounded-xl shadow-sm pr-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {strength && (
                <div className="space-y-1 pt-0.5">
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password strength: <span className="font-medium text-foreground/70">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/8 border border-destructive/15 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200"
            >
              {registerMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Sparkles className="w-4 h-4 mr-1.5" /><span>Create Free Account</span></>
              }
            </Button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground">Already have an account?</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <Link href="/signin">
            <Button variant="outline" className="w-full h-11 rounded-xl border-border bg-white hover:bg-accent/40 text-foreground font-medium shadow-sm">
              Sign in instead
            </Button>
          </Link>

          <p className="text-center text-xs text-muted-foreground/50">
            By creating an account you agree to our{" "}
            <span className="text-primary/60 hover:text-primary cursor-pointer transition-colors">Terms</span>{" "}
            and{" "}
            <span className="text-primary/60 hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
