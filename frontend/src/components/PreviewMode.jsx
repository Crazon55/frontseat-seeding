import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Eye, X, ChevronDown } from "lucide-react";

/**
 * Sticky banner shown to admins while they're impersonating another role.
 * Lets the admin switch between roles or exit preview at any time.
 */
export const PreviewBanner = () => {
  const { impersonating, realAdminEmail, user, team, exitPreview, enterPreview } = useAuth();
  const [targets, setTargets] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!impersonating) return;
    api.get("/admin/preview-targets").then(({ data }) => setTargets(data)).catch(() => {});
  }, [impersonating]);

  if (!impersonating) return null;

  const roleLabel = user?.role === "bd"
    ? `BD · ${team?.team_name || user?.business_team_id || "—"}`
    : user?.role === "fulfillment" ? "Fulfillment"
    : user?.role === "pending" ? "Pending / Unassigned"
    : user?.role;

  return (
    <div
      data-testid="preview-banner"
      className="sticky top-0 z-50 w-full bg-amber-500/95 text-black border-b border-amber-700/40 backdrop-blur"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <div className="max-w-[1400px] mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <Eye size={14} strokeWidth={2} />
        <div className="font-medium">
          Previewing as <span className="font-semibold" data-testid="preview-banner-role">{user?.name} ({roleLabel})</span>
        </div>
        <div className="text-xs opacity-70 hidden md:block">
          Real session: {realAdminEmail}
        </div>

        <div className="ml-auto flex items-center gap-2 relative">
          <button
            data-testid="preview-switch-button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 bg-black/10 hover:bg-black/20 text-black rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
          >
            Switch role <ChevronDown size={12} strokeWidth={2} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#121212] border border-zinc-800 rounded-lg shadow-lg overflow-hidden text-zinc-100">
              <div className="max-h-72 overflow-y-auto py-1">
                {targets.map((t) => (
                  <button
                    key={t.user_id}
                    data-testid={`preview-switch-${t.email}`}
                    onClick={() => { setOpen(false); enterPreview(t.email); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 transition-colors ${t.email === user?.email ? "bg-zinc-900" : ""}`}
                  >
                    <div className="text-white font-medium">{t.name}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      {t.role}{t.team_name ? ` · ${t.team_name}` : ""}
                    </div>
                  </button>
                ))}
                {!targets.length && <div className="px-3 py-2 text-xs text-zinc-500">Loading…</div>}
              </div>
            </div>
          )}
          <button
            data-testid="preview-exit-button"
            onClick={exitPreview}
            className="inline-flex items-center gap-1 bg-black text-white hover:bg-zinc-900 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
          >
            <X size={12} strokeWidth={2} /> Exit Preview
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Sidebar widget shown to real admins (not while impersonating) — opens a dropdown of targets.
 */
export const PreviewLauncher = () => {
  const { user, impersonating, enterPreview } = useAuth();
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    if (user?.role !== "admin" || impersonating) return;
    api.get("/admin/preview-targets").then(({ data }) => setTargets(data)).catch(() => {});
  }, [user?.role, impersonating]);

  if (user?.role !== "admin" || impersonating) return null;

  return (
    <div className="relative">
      <button
        data-testid="preview-launcher-button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors"
      >
        <span className="inline-flex items-center gap-2"><Eye size={13} strokeWidth={1.5}/> Preview as…</span>
        <ChevronDown size={12} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-[#121212] border border-zinc-800 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-72 overflow-y-auto py-1">
            {targets.map((t) => (
              <button
                key={t.user_id}
                data-testid={`preview-launcher-${t.email}`}
                onClick={() => { setOpen(false); enterPreview(t.email); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 transition-colors"
              >
                <div className="text-white font-medium">{t.name}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  {t.role}{t.team_name ? ` · ${t.team_name}` : ""}
                </div>
              </button>
            ))}
            {!targets.length && <div className="px-3 py-2 text-xs text-zinc-500">Loading…</div>}
          </div>
        </div>
      )}
    </div>
  );
};
