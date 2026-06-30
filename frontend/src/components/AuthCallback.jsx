import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, setSessionToken } from "../lib/api";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser, refresh } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.access_token) {
          navigate("/login");
          return;
        }

        const { data } = await api.post("/auth/session", { access_token: session.access_token });
        if (data?.session_token) setSessionToken(data.session_token);
        if (data?.user) setUser(data.user);
        await refresh();
        window.history.replaceState({}, document.title, "/");
        navigate("/", { replace: true });
      } catch (e) {
        const msg = e?.response?.data?.detail || e?.message || "Sign-in failed";
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
