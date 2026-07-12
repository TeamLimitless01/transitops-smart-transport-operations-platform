"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "@/lib/validations/auth";

const ROLE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  FLEET_MANAGER: { label: "Fleet Manager", color: "#6366f1", icon: "🚦" },
  DRIVER: { label: "Driver", color: "#10b981", icon: "🚛" },
  SAFETY_OFFICER: { label: "Safety Officer", color: "#f59e0b", icon: "🛡️" },
  FINANCIAL_ANALYST: { label: "Financial Analyst", color: "#3b82f6", icon: "📊" },
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string[]; password?: string[] }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validate = () => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Invalid email or password. Please try again.");
        return;
      }

      router.push(from);
      router.refresh();
    });
  };

  return (
    <div className="login-root">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-grid" />
      </div>

      <div className="login-card-wrapper">
        {/* Logo / Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 17l4-8 4 4 4-6 4 10H3z" fill="#6366f1" opacity="0.9" />
              <rect x="2" y="17" width="20" height="2" rx="1" fill="#6366f1" />
              <circle cx="6" cy="20" r="1.5" fill="#a5b4fc" />
              <circle cx="18" cy="20" r="1.5" fill="#a5b4fc" />
            </svg>
          </div>
          <span className="login-brand-name">TransitOps</span>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to your operations dashboard</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="login-form">
            {/* Server error */}
            {serverError && (
              <div className="login-error-banner" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="login-field">
              <label htmlFor="email" className="login-label">Email address</label>
              <div className={`login-input-wrap ${fieldErrors.email ? "login-input-error" : ""}`}>
                <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                />
              </div>
              {fieldErrors.email && (
                <p className="login-field-error">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="password" className="login-label">Password</label>
              <div className={`login-input-wrap ${fieldErrors.password ? "login-input-error" : ""}`}>
                <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                </svg>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="login-pass-toggle"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="login-field-error">{fieldErrors.password[0]}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isPending}
              className="login-btn"
            >
              {isPending ? (
                <span className="login-spinner" />
              ) : (
                <>
                  Sign in
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Roles hint */}
          <div className="login-roles">
            <p className="login-roles-label">Platform roles</p>
            <div className="login-roles-grid">
              {Object.entries(ROLE_LABELS).map(([, { label, color, icon }]) => (
                <div key={label} className="login-role-chip" style={{ "--role-color": color } as React.CSSProperties}>
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="login-footer">
          TransitOps &copy; {new Date().getFullYear()} &mdash; Smart Transport Operations
        </p>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0f;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Animated orbs */
        .login-bg { position: absolute; inset: 0; pointer-events: none; }
        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: float 8s ease-in-out infinite;
        }
        .login-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          top: -150px; left: -100px;
          animation-delay: 0s;
        }
        .login-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%);
          bottom: -100px; right: -80px;
          animation-delay: -3s;
        }
        .login-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
          top: 50%; left: 60%;
          animation-delay: -5s;
        }
        .login-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        .login-card-wrapper {
          position: relative; z-index: 10;
          width: 100%; max-width: 440px;
          padding: 24px 16px;
          display: flex; flex-direction: column; align-items: center; gap: 24px;
        }

        /* Brand */
        .login-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .login-logo {
          width: 44px; height: 44px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .login-brand-name {
          font-size: 22px; font-weight: 700;
          color: #f1f5f9; letter-spacing: -0.5px;
        }

        /* Card */
        .login-card {
          width: 100%;
          background: rgba(15,15,25,0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 20px;
          padding: 32px;
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.08),
            0 32px 64px -12px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .login-card-header { margin-bottom: 28px; }
        .login-title {
          font-size: 26px; font-weight: 700;
          color: #f1f5f9; letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .login-subtitle { font-size: 14px; color: #64748b; }

        /* Form */
        .login-form { display: flex; flex-direction: column; gap: 20px; }

        .login-error-banner {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 13.5px; color: #fca5a5;
          animation: slideIn 0.2s ease;
        }

        .login-field { display: flex; flex-direction: column; gap: 7px; }
        .login-label {
          font-size: 13px; font-weight: 500; color: #94a3b8;
          letter-spacing: 0.2px;
        }

        .login-input-wrap {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 11px;
          padding: 0 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input-wrap:focus-within {
          border-color: rgba(99,102,241,0.6);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .login-input-wrap.login-input-error {
          border-color: rgba(239,68,68,0.5);
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
        }

        .login-input-icon { color: #475569; flex-shrink: 0; }

        .login-input {
          flex: 1; height: 46px;
          background: transparent; border: none; outline: none;
          font-size: 14.5px; color: #f1f5f9;
          font-family: inherit;
        }
        .login-input::placeholder { color: #334155; }

        .login-pass-toggle {
          background: none; border: none; cursor: pointer;
          color: #475569; padding: 4px;
          display: flex; align-items: center;
          transition: color 0.2s;
          border-radius: 6px;
        }
        .login-pass-toggle:hover { color: #94a3b8; }

        .login-field-error {
          font-size: 12px; color: #f87171;
          display: flex; align-items: center; gap: 4px;
        }

        /* Submit button */
        .login-btn {
          height: 48px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff; font-size: 15px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 8px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          font-family: inherit;
          margin-top: 4px;
        }
        .login-btn:hover:not(:disabled) {
          opacity: 0.92; transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(99,102,241,0.45);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Spinner */
        .login-spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Roles */
        .login-roles {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .login-roles-label {
          font-size: 11px; font-weight: 600; letter-spacing: 1px;
          color: #334155; text-transform: uppercase; margin-bottom: 12px;
        }
        .login-roles-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        }
        .login-role-chip {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px; padding: 8px 10px;
          font-size: 12px; color: #64748b;
          transition: border-color 0.2s, background 0.2s;
        }
        .login-role-chip:hover {
          border-color: rgba(var(--role-color), 0.3);
          background: rgba(var(--role-color), 0.05);
          color: #94a3b8;
        }

        .login-footer {
          font-size: 12px; color: #1e293b; text-align: center;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .login-card { padding: 24px 20px; }
          .login-roles-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
