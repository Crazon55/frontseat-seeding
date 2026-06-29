import React from "react";
import { useAuth } from "../lib/auth";
import { Clock } from "lucide-react";

export const PendingApproval = () => {
  const { user, logout, impersonating, exitPreview } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-100 px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-zinc-900 grid place-items-center border border-zinc-800">
          <Clock size={22} strokeWidth={1.5} className="text-zinc-300" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          You&apos;re on the waitlist
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-2" data-testid="pending-message">
          Your account is pending admin approval. Please ask the admin to assign your role.
        </p>
        <p className="text-xs text-zinc-500 mt-4">
          Signed in as <span className="text-zinc-300">{user?.email}</span>
        </p>
        {impersonating ? (
          <button
            data-testid="pending-exit-preview-button"
            onClick={exitPreview}
            className="mt-8 text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
          >
            Exit preview
          </button>
        ) : (
          <button
            data-testid="pending-logout-button"
            onClick={logout}
            className="mt-8 text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
};

export default PendingApproval;
