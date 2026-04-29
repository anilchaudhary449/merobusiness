"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  }

  // If unauthenticated, redirect to login
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // If authenticated but doesn't require reset, go to dashboard
  if (session?.user && !(session.user as any).requirePasswordChange && !success) {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      // Update session to reflect requirePasswordChange = false
      await update({ requirePasswordChange: false });

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        
        {success ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Password Updated!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Your password has been successfully secured. Redirecting you...
            </p>
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Mandatory Reset</h2>
            <p className="text-slate-500 text-sm mb-8">
              Because you are using a temporary password, you must create a new, secure password before continuing.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold text-left">
                  {error}
                </div>
              )}
              
              <div className="text-left">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  required
                />
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  required
                />
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 mt-4"
              >
                {isLoading ? 'Updating...' : 'Update Password & Continue'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
