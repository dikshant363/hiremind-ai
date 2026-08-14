"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Mail, User, Shield, LogOut, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHireMind } from "@/lib/store";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { currentUser, setCurrentUser, fetchCurrentUser } = useHireMind();
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setError(null);
      fetchCurrentUser();
    }
  }, [open, fetchCurrentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed.");

      setCurrentUser(data.user);
      toast.success(mode === "login" ? `Welcome back, ${data.user.name || data.user.email}!` : "Account created successfully!");
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      toast.success("Signed out successfully.");
      onClose();
    } catch {
      toast.error("Logout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="hm-card hm-glass-panel relative w-full max-w-md p-6 sm:p-8 shadow-2xl border border-border/80 rounded-2xl z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {currentUser ? (
            /* Logged-in profile view */
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue/15 text-accent-blue text-lg font-semibold ring-1 ring-accent-blue/30">
                  {currentUser.name?.[0]?.toUpperCase() || currentUser.email[0].toUpperCase()}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{currentUser.name || "Authenticated User"}</h3>
                    <span className="rounded-full bg-accent-blue/10 text-accent-blue text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>

              <div className="space-y-3 bg-secondary/40 p-4 rounded-xl text-xs text-muted-foreground mb-6">
                <div className="flex items-center justify-between">
                  <span>Authentication Status</span>
                  <span className="text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active & Verified
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Session Security</span>
                  <span className="font-medium text-foreground">HMAC-SHA256 Token</span>
                </div>
                {currentUser.role === "admin" && (
                  <div className="flex items-center justify-between">
                    <span>Admin Control Center</span>
                    <span className="text-accent-blue font-medium">Full Access</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Done
                </Button>
                <Button variant="destructive" className="flex-1 gap-2" onClick={handleLogout} disabled={submitting}>
                  <LogOut className="h-4 w-4" />
                  {submitting ? "Signing out…" : "Sign out"}
                </Button>
              </div>
            </div>
          ) : (
            /* Login / Register form */
            <div>
              <div className="text-center mb-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-3 shadow-md">
                  <Shield className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-semibold tracking-tight">
                  {mode === "login" ? "Sign in to HireMind" : "Create an Account"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {mode === "login"
                    ? "Access your candidate profiles, interview history, and roadmaps"
                    : "Track your progress and access personalized career readiness analytics"}
                </p>
              </div>

              {/* Mode toggle */}
              <div className="flex bg-secondary/60 p-1 rounded-lg mb-5">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(null); }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === "login" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(null); }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === "register" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Register
                </button>
              </div>

              {error && (
                <div className="p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === "register" && (
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Full Name</label>
                    <div className="relative">
                      <User className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="e.g. Alex Rivera"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>
                  {mode === "register" && (
                    <p className="text-[10px] text-muted-foreground mt-1">Minimum 6 characters with secure salted hash.</p>
                  )}
                </div>

                <Button type="submit" className="w-full mt-5 gap-2" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{mode === "login" ? "Signing in…" : "Creating account…"}</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
