import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setSessionToken, getPreviewAs, setPreviewAs } from "./api";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);     // effective user (after impersonation)
  const [team, setTeam] = useState(null);
  const [realAdminEmail, setRealAdminEmail] = useState(null); // populated when impersonating
  const [impersonating, setImpersonating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setTeam(data.team);
      setImpersonating(!!data.impersonating);
      setRealAdminEmail(data.real_admin_email || null);
      return data;
    } catch (e) {
      setUser(null);
      setTeam(null);
      setImpersonating(false);
      setRealAdminEmail(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (window.location.pathname === "/auth/callback") {
      setLoading(false);
      return;
    }
    fetchMe();
  }, [fetchMe]);

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (e) { /* noop */ }
    try { await supabase.auth.signOut(); } catch (e) { /* noop */ }
    setSessionToken(null);
    setPreviewAs(null);
    setUser(null);
    setTeam(null);
    window.location.href = "/login";
  };

  const enterPreview = async (email) => {
    setPreviewAs(email);
    setLoading(true);
    await fetchMe();
    window.location.href = "/";  // hard nav so role-based RoleHome re-evaluates cleanly
  };

  const exitPreview = async () => {
    setPreviewAs(null);
    setLoading(true);
    await fetchMe();
    window.location.href = "/";
  };

  const previewAsEmail = getPreviewAs();

  return (
    <AuthContext.Provider value={{
      user, team, loading, impersonating, realAdminEmail, previewAsEmail,
      refresh: fetchMe, setUser, setTeam, logout, enterPreview, exitPreview,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
