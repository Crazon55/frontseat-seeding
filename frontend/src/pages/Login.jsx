import React from "react";

export const Login = () => {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-100 px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-white text-black grid place-items-center font-semibold text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>F</div>
            <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Frontseat Seeding</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            One source of truth.
          </h1>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Brand briefs in. Admin approvals. Fulfillment execution. Revenue and payments — all in one calm internal dashboard.
          </p>
        </div>

        <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-6">
          <button
            data-testid="google-login-button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-200 transition-colors duration-200 rounded-lg px-4 py-3 text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>
          <p className="mt-4 text-xs text-zinc-500 text-center leading-relaxed">
            Restricted to <span className="text-zinc-300">@owledmedia.com</span> emails. New accounts require admin approval before access.
          </p>
        </div>

        <div className="mt-8 text-center text-[11px] text-zinc-600">
          Internal tool · Frontseat Seeding v1
        </div>
      </div>
    </div>
  );
};

export default Login;
