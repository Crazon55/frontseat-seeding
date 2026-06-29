import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, setSessionToken } from "../lib/api";
import { useAuth } from "../lib/auth";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, refresh } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash || "";
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) {
      navigate("/login");
      return;
    }
    const session_id = m[1];

    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id });
        if (data?.session_token) setSessionToken(data.session_token);
        if (data?.user) setUser(data.user);
        await refresh();
        // strip hash and route based on role
        window.history.replaceState({}, document.title, "/");
        navigate("/", { replace: true });
      } catch (e) {
        const msg = e?.response?.data?.detail || "Sign-in failed";
        alert(msg);
        navigate("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-[#09090b] text-zinc-300">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">Signing you in…</p>
      </div>
    </div>
  );
};
