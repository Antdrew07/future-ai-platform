import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Zap } from "lucide-react";

export default function SignIn() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      navigate("/dashboard");
    },
    onError: (err) => {
      setError(err.message || "Invalid email or password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029617589/m5GbkNTBEjcM6aS7UZa8ie/future-logo_e02304b5.png"
              alt="Future"
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold gradient-text font-display">Future</span>
          </Link>
          <h1 className="text-2xl font-bold text-white font-display">Welcome back</h1>
          <p className="text-[#8b8b9a] mt-1 text-sm">Sign in to your Future account</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#c4c4d0] text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#555568] focus:border-violet-500 focus:ring-violet-500/20 h-11"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#c4c4d0] text-sm font-medium">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  onClick={() => {}}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-[#555568] focus:border-violet-500 focus:ring-violet-500/20 h-11 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555568] hover:text-[#8b8b9a] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#8b8b9a]">
            Don't have an account?{" "}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Create one free
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[#555568] mt-6">
          By signing in, you agree to our{" "}
          <span className="text-[#8b8b9a] hover:text-violet-400 cursor-pointer transition-colors">Terms of Service</span>{" "}
          and{" "}
          <span className="text-[#8b8b9a] hover:text-violet-400 cursor-pointer transition-colors">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
