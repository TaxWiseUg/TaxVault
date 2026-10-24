"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { supabase, safeStorage } from "../lib/supabaseClient";
import { C } from "../lib/constants";
import { LegalPortal } from "./LegalPortal";
import { AlertTriangle, ArrowLeft, ShieldCheck, Lock, Mail, User, Eye, EyeOff } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthMode = "login" | "signup" | "forgot" | "reset-code" | "update-password" | "verify-signup";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  agreeTerms?: string;
  otp?: string;
}

interface AuthPageProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
  initialMode?: AuthMode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map: Record<number, { label: string; color: string }> = {
    0: { label: "Too short", color: C.red },
    1: { label: "Weak", color: C.red },
    2: { label: "Fair", color: C.gold },
    3: { label: "Good", color: "#2563EB" },
    4: { label: "Strong", color: C.green },
  };
  return { score: score as 0 | 1 | 2 | 3 | 4, ...map[score] };
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
  </svg>
);

// ─── OTP Input Component ──────────────────────────────────────────────────────

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  length?: number;
  alphanumeric?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, error, length = 6, alphanumeric = false }) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const cleanValue = useCallback((val: string) => {
    return alphanumeric ? val.replace(/[^a-zA-Z0-9]/g, "") : val.replace(/\D/g, "");
  }, [alphanumeric]);

  const digits = cleanValue(value).padEnd(length, "").split("").slice(0, length);

  const focusBox = (i: number) => {
    inputs.current[Math.max(0, Math.min(length - 1, i))]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) {
        next[i] = "";
        onChange(cleanValue(next.join("")));
      } else if (i > 0) {
        next[i - 1] = "";
        onChange(cleanValue(next.join("")));
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      focusBox(i - 1);
    } else if (e.key === "ArrowRight") {
      focusBox(i + 1);
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = cleanValue(e.target.value);
    if (!raw) return;
    // Support paste — spread characters across boxes
    if (raw.length > 1) {
      const pasted = raw.slice(0, length).split("");
      const next = [...digits];
      pasted.forEach((ch, idx) => { if (i + idx < length) next[i + idx] = ch; });
      onChange(cleanValue(next.join("")));
      focusBox(Math.min(length - 1, i + pasted.length));
      return;
    }
    const next = [...digits];
    next[i] = raw[0];
    onChange(cleanValue(next.join("")));
    if (i < length - 1) focusBox(i + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const raw = cleanValue(e.clipboardData.getData("text")).slice(0, length);
    const filled = digits.map((d, i) => (raw[i] !== undefined ? raw[i] : d));
    onChange(cleanValue(filled.join("")));
    focusBox(Math.min(length - 1, raw.length));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 4, flexWrap: "wrap" }}>
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode={alphanumeric ? "text" : "numeric"}
            maxLength={length}
            value={digits[i] || ""}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            style={{
              width: length === 8 ? 36 : 46,
              height: length === 8 ? 44 : 54,
              textAlign: "center",
              fontSize: length === 8 ? "1.2rem" : "1.4rem",
              fontWeight: 800,
              fontFamily: "'Inter', monospace",
              border: `2px solid ${error ? C.red : digits[i] ? C.teal : C.border}`,
              borderRadius: 10,
              background: digits[i] ? "var(--auth-otp-filled)" : "var(--auth-field)",
              color: "var(--auth-text)",
              outline: "none",
              transition: "all 0.15s ease",
              boxSizing: "border-box",
              caretColor: "var(--auth-accent)",
            }}
          />
        ))}
      </div>
      {error && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 8, fontSize: "0.75rem", color: C.red, fontWeight: 600, animation: "authFadeIn 0.2s ease" }}>
          <AlertTriangle size={13} /> {error}
        </div>
      )}
    </div>
  );
};

// ─── Form Field Wrapper ───────────────────────────────────────────────────────

const FormField: React.FC<{ label: string; required?: boolean; error?: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ label, required, error, icon, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--auth-label)", marginBottom: 6 }}>
      {label}{required && <span style={{ color: "#E04838" }}> *</span>}
    </label>
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {icon && (
        <span style={{ position: "absolute", left: 14, color: "var(--auth-muted)", display: "flex", alignItems: "center", pointerEvents: "none", zIndex: 2 }}>
          {icon}
        </span>
      )}
      {children}
    </div>
    {error && (
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: "0.74rem", color: "#DC2626", fontWeight: 600, animation: "authFadeIn 0.2s ease" }}>
        <AlertTriangle size={13} /> {error}
      </div>
    )}
  </div>
);

// ─── Password Field with Eye Toggle ──────────────────────────────────────────

const PasswordField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  showStrength?: boolean;
  showForgot?: boolean;
  onForgot?: () => void;
}> = ({ label, value, onChange, error, placeholder = "Enter your password", required, showStrength, showForgot, onForgot }) => {
  const [show, setShow] = useState(false);
  const pwStrength = getPasswordStrength(value);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: error ? "1.5px solid #EF4444" : "1px solid var(--auth-border)",
    borderRadius: 10,
    padding: "13px 44px 13px 42px",
    fontSize: "0.88rem",
    fontFamily: "inherit",
    outline: "none",
    background: "var(--auth-field)",
    color: "var(--auth-text)",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(15, 32, 68, 0.04)",
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--auth-label)", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#E04838" }}> *</span>}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: 14, color: "var(--auth-muted)", display: "flex", alignItems: "center", pointerEvents: "none", zIndex: 2 }}>
          <Lock size={16} />
        </span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          style={{ position: "absolute", right: 14, background: "none", border: "none", color: "var(--auth-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {showForgot && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <button
            type="button"
            onClick={onForgot}
            style={{ background: "none", border: "none", color: "var(--auth-label)", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer", padding: 0 }}
          >
            Forgot your password?
          </button>
        </div>
      )}
      {showStrength && value && (
        <div style={{ marginTop: 8 }}>
          <div className="strength-bar-track">
            <div
              className="strength-bar-fill"
              style={{ width: `${(pwStrength.score / 4) * 100}%`, background: pwStrength.color }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: "0.72rem", color: pwStrength.color, fontWeight: 700 }}>{pwStrength.label}</span>
            <span style={{ fontSize: "0.7rem", color: "var(--auth-muted)", fontWeight: 500 }}>
              {pwStrength.score < 3 ? "Add uppercase, numbers & symbols" : "Great password!"}
            </span>
          </div>
        </div>
      )}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: "0.74rem", color: "#DC2626", fontWeight: 600, animation: "authFadeIn 0.2s ease" }}>
          <AlertTriangle size={13} /> {error}
        </div>
      )}
    </div>
  );
};

// ─── Confirm Password Match Indicator ────────────────────────────────────────

const ConfirmPasswordField: React.FC<{
  label: string;
  value: string;
  matchValue: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}> = ({ label, value, matchValue, onChange, error, required }) => {
  const [show, setShow] = useState(false);
  const matches = value && value === matchValue;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: error ? "1.5px solid #EF4444" : matches ? "1.5px solid var(--auth-success)" : "1px solid var(--auth-border)",
    borderRadius: 10,
    padding: "13px 44px 13px 42px",
    fontSize: "0.88rem",
    fontFamily: "inherit",
    outline: "none",
    background: "var(--auth-field)",
    color: "var(--auth-text)",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(15, 32, 68, 0.04)",
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--auth-label)", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#E04838" }}> *</span>}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: 14, color: "var(--auth-muted)", display: "flex", alignItems: "center", pointerEvents: "none", zIndex: 2 }}>
          <Lock size={16} />
        </span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Confirm your password"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          style={{ position: "absolute", right: 14, background: "none", border: "none", color: "var(--auth-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: "0.74rem", color: "#DC2626", fontWeight: 600, animation: "authFadeIn 0.2s ease" }}>
          <AlertTriangle size={13} /> {error}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onBack, initialMode }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode || "login");

  // Sign-in / Sign-up
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Tax Consultant");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<"privacy" | "terms" | "blog">("privacy");

  // Reset-code mode
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // OTP (shared between verify + reset-code)
  const [otpCode, setOtpCode] = useState("");
  const [expectedSignupOtp, setExpectedSignupOtp] = useState("");

  // Status
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── Clean mode switch ──
  const switchMode = (next: AuthMode) => {
    setMode(next);
    setFieldErrors({});
    setGlobalError("");
    setSuccessMsg("");
    setOtpCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setExpectedSignupOtp("");
  };

  useEffect(() => {
    if (initialMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      switchMode(initialMode);
    }
  }, [initialMode]);

  // ── Validate login / signup fields ──
  const validate = useCallback((): boolean => {
    const errors: FieldErrors = {};

    if (mode === "forgot") {
      if (!email) errors.email = "Email is required.";
      else if (!EMAIL_REGEX.test(email)) errors.email = "Enter a valid email address.";
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }

    if (mode === "verify-signup") {
      if (otpCode.replace(/[^0-9]/g, "").length < 5) errors.otp = "Enter the full 5-digit verification code.";
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }

    if (mode === "reset-code") {
      if (otpCode.replace(/[^0-9]/g, "").length < 5) errors.otp = "Enter the full 5-digit code.";
      if (!newPassword) errors.newPassword = "New password is required.";
      else if (newPassword.length < 8) errors.newPassword = "Must be at least 8 characters.";
      else if (!/[A-Z]/.test(newPassword)) errors.newPassword = "Must include an uppercase letter.";
      else if (!/[0-9]/.test(newPassword)) errors.newPassword = "Must include a number.";
      if (!confirmNewPassword) errors.confirmNewPassword = "Please confirm your new password.";
      else if (newPassword !== confirmNewPassword) errors.confirmNewPassword = "Passwords do not match.";
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }

    if (mode === "update-password") {
      if (!newPassword) errors.newPassword = "New password is required.";
      else if (newPassword.length < 8) errors.newPassword = "Must be at least 8 characters.";
      else if (!/[A-Z]/.test(newPassword)) errors.newPassword = "Must include an uppercase letter.";
      else if (!/[0-9]/.test(newPassword)) errors.newPassword = "Must include a number.";
      if (!confirmNewPassword) errors.confirmNewPassword = "Please confirm your new password.";
      else if (newPassword !== confirmNewPassword) errors.confirmNewPassword = "Passwords do not match.";
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }

    if (mode === "signup" && !name.trim()) errors.name = "Full name is required.";
    else if (mode === "signup" && name.trim().length < 2) errors.name = "Name must be at least 2 characters.";

    if (!email) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email)) errors.email = "Enter a valid email address.";

    if (!password) errors.password = "Password is required.";
    else if (mode === "signup" && password.length < 8) errors.password = "Must be at least 8 characters.";
    else if (mode === "signup" && !/[A-Z]/.test(password)) errors.password = "Must include an uppercase letter.";
    else if (mode === "signup" && !/[0-9]/.test(password)) errors.password = "Must include a number.";

    if (mode === "signup" && !confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (mode === "signup" && password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
    if (mode === "signup" && !agreeTerms) errors.agreeTerms = "You must accept the terms to continue.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [mode, name, email, password, confirmPassword, agreeTerms, otpCode, newPassword, confirmNewPassword]);

  // ── Send forgot-password email ──
  const handleForgotPassword = async () => {
    if (!validate()) return;
    setLoading(true); setGlobalError(""); setSuccessMsg("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "reset" }),
      });
      let result: any = {};
      try {
        result = await response.json();
      } catch {
        throw new Error(`Server returned status ${response.status}`);
      }
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to send verification email.");
      }

      // Save code locally so verifyOtp or local check can match it
      if (typeof window !== "undefined") {
        safeStorage.setItem("mock_otp_code", result.code);
        safeStorage.setItem("mock_otp_email", email);
      }

      // Transition to code entry screen
      switchMode("reset-code");
      if (result.warning) {
        setSuccessMsg(`Email delivery note (${result.warning}). For testing, please enter code: ${result.code}`);
      } else {
        setSuccessMsg("Reset code sent! Please check your email inbox.");
      }
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP + set new password ──
  const handleResetWithCode = async () => {
    if (!validate()) return;
    setLoading(true); setGlobalError(""); setSuccessMsg("");
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: "recovery",
      });
      if (verifyError) throw verifyError;
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      // Sign out recovery session, go to login
      await supabase.auth.signOut();
      switchMode("login");
      setSuccessMsg("Password reset! You can now sign in with your new password.");
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Update password directly (recovery link bypass) ──
  const handleUpdatePasswordOnly = async () => {
    if (!validate()) return;
    setLoading(true); setGlobalError(""); setSuccessMsg("");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      // Sign out recovery session, go to login
      await supabase.auth.signOut();
      switchMode("login");
      setSuccessMsg("Password updated successfully! You can now sign in.");
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };


  // ── Resend reset code ──
  const handleResendResetCode = async () => {
    setResendLoading(true); setGlobalError(""); setSuccessMsg("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "reset" }),
      });
      let result: any = {};
      try {
        result = await response.json();
      } catch {
        throw new Error(`Server returned status ${response.status}`);
      }
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to resend verification email.");
      }

      if (typeof window !== "undefined") {
        safeStorage.setItem("mock_otp_code", result.code);
        safeStorage.setItem("mock_otp_email", email);
      }

      setOtpCode("");
      if (result.warning) {
        setSuccessMsg(`Email delivery note (${result.warning}). For testing, please enter code: ${result.code}`);
      } else {
        setSuccessMsg("New reset code sent! Check your inbox.");
      }
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "Failed to resend reset email.");
    } finally {
      setResendLoading(false);
    }
  };

  // ── Create account directly and log in without OTP email verification ──
  const handleSignupRequest = async () => {
    setLoading(true); setGlobalError(""); setSuccessMsg("");
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: name.trim(),
          role,
        }),
      });

      let result: any = {};
      try {
        result = await response.json();
      } catch {
        throw new Error(`Server returned status ${response.status}`);
      }
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to create account.");
      }

      // Auto login immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;

      onLoginSuccess();
    } catch (err: unknown) {
      setGlobalError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Verify signup code and complete registration ──
  const handleVerifySignup = async () => {
    if (!validate()) return;
    setLoading(true); setGlobalError(""); setSuccessMsg("");
    try {
      const savedCode = expectedSignupOtp || (typeof window !== "undefined" ? safeStorage.getItem("mock_signup_otp") : "") || "";
      const savedEmail = email || (typeof window !== "undefined" ? safeStorage.getItem("mock_signup_email") : "") || "";

      if (!savedCode || savedCode.trim().toUpperCase() !== otpCode.trim().toUpperCase()) {
        throw new Error("Invalid verification code. Please check and try again.");
      }

      // OTP matches! Proceed to create the actual user account!
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: savedEmail,
          password,
          full_name: name.trim(),
          role,
        }),
      });

      let result: any = {};
      try {
        result = await response.json();
      } catch {
        throw new Error(`Server returned status ${response.status}`);
      }
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to create account.");
      }

      // Auto login
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: savedEmail, password });
      if (signInError) throw signInError;

      if (typeof window !== "undefined") {
        safeStorage.removeItem("mock_signup_otp");
        safeStorage.removeItem("mock_signup_email");
      }

      onLoginSuccess();
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend signup code ──
  const handleResendSignupCode = async () => {
    setResendLoading(true); setGlobalError(""); setSuccessMsg("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type: "signup",
          fullName: name.trim(),
        }),
      });

      let result: any = {};
      try {
        result = await response.json();
      } catch {
        throw new Error(`Server returned status ${response.status}`);
      }
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to resend verification email.");
      }

      setExpectedSignupOtp(result.code);
      if (typeof window !== "undefined") {
        safeStorage.setItem("mock_signup_otp", result.code);
        safeStorage.setItem("mock_signup_email", email);
      }

      setOtpCode("");
      if (result.warning) {
        setSuccessMsg(`New code delivery note (${result.warning}). For testing, please enter code: ${result.code}`);
      } else {
        setSuccessMsg("New verification code sent! Check your inbox.");
      }
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "Failed to resend verification code.");
    } finally {
      setResendLoading(false);
    }
  };

  // ── Main sign-in / sign-up ──
  const formatAuthError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error || "");
    const lower = message.toLowerCase();

    if ((lower.includes("already") && lower.includes("registered")) || lower.includes("auth.user_already_exists")) {
      return "This email is already registered. Please sign in instead.";
    }
    if (lower.includes("duplicate") || lower.includes("unique constraint") || lower.includes("user already exists")) {
      return "This email is already registered. Please sign in instead.";
    }
    return message || "An authentication error occurred.";
  };

  const handleAuth = async () => {
    if (!validate()) return;
    setLoading(true); setGlobalError(""); setSuccessMsg("");
    try {
      if (mode === "signup") {
        await handleSignupRequest();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onLoginSuccess();
      }
    } catch (err: unknown) {
      setGlobalError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) {
        setGlobalError(error.message);
      }
    } catch (err: unknown) {
      setGlobalError((err as Error).message || "Google sign-in is currently unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%",
    border: hasError ? "1.5px solid #EF4444" : "1px solid var(--auth-border)",
    borderRadius: 10,
    padding: "13px 16px 13px 44px",
    fontSize: "0.88rem",
    fontFamily: "inherit",
    outline: "none",
    background: "var(--auth-field)",
    color: "var(--auth-text)",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(15, 32, 68, 0.04)",
  });

  // ─── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="auth-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap');

        @keyframes authFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes strengthGrow { from { width: 0; } }

        .auth-root {
          height: 100vh;
          width: 100vw;
          max-height: 100vh;
          overflow: hidden;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          position: relative;
          background-image: linear-gradient(to right, rgba(6, 12, 20, 0.76) 0%, rgba(6, 12, 20, 0.44) 50%, rgba(6, 12, 20, 0.72) 100%), url('/assets/taxwise_auth_abstract_bg.jpg');
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-inner {
          width: 100%;
          max-width: 1280px;
          height: 100vh;
          max-height: 100vh;
          margin: 0 auto;
          padding: 36px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 56px;
          position: relative;
          z-index: 10;
          box-sizing: border-box;
          overflow: hidden;
        }

        /* ── Left Branded Column (Locked Viewport, Non-Scrolling) ── */
        .auth-left {
          flex: 1.15;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: calc(100vh - 72px);
          max-height: calc(100vh - 72px);
          color: #FFFFFF;
          max-width: 580px;
          overflow: hidden;
          user-select: none;
        }

        .auth-topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .auth-back-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 9999px;
          color: #FFFFFF;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: inherit;
          padding: 8px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .auth-back-pill:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateX(-2px);
        }

        .auth-brand-name {
          color: #FFFFFF;
        }

        .auth-quote-area {
          margin: 48px 0;
        }

        .auth-quote-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.4rem, 4vw, 3.6rem);
          line-height: 1.14;
          font-weight: 700;
          letter-spacing: -0.015em;
          color: #FFFFFF;
          margin-bottom: 18px;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.4);
        }

        .auth-quote-subtitle {
          font-size: 1.12rem;
          color: rgba(255, 255, 255, 0.88);
          font-weight: 500;
          line-height: 1.5;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
        }

        .auth-bottom-badges {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .auth-compliance-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.88);
          font-weight: 500;
          max-width: fit-content;
        }

        /* ── Right Floating Card Container ── */
        .auth-right {
          flex: 0.95;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          width: 100%;
          height: 100%;
          max-height: calc(100vh - 48px);
        }

        .auth-card-sprout {
          width: 100%;
          max-width: 440px;
          background: #FFF7F0;
          border-radius: 32px;
          padding: 38px 36px 32px;
          box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.42), 0 0 1px rgba(0, 0, 0, 0.12);
          box-sizing: border-box;
          animation: authFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          max-height: calc(100vh - 56px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(74, 164, 27, 0.35) transparent;
        }

        .auth-card-sprout::-webkit-scrollbar {
          width: 5px;
        }
        .auth-card-sprout::-webkit-scrollbar-track {
          background: transparent;
        }
        .auth-card-sprout::-webkit-scrollbar-thumb {
          background: rgba(74, 164, 27, 0.3);
          border-radius: 10px;
        }
        .auth-card-sprout::-webkit-scrollbar-thumb:hover {
          background: rgba(74, 164, 27, 0.6);
        }

        .auth-card-title {
          font-size: 1.55rem;
          font-weight: 800;
          color: #1F1914;
          letter-spacing: -0.025em;
          text-align: center;
          margin-bottom: 6px;
        }

        .auth-card-subtitle {
          font-size: 0.84rem;
          color: #786C62;
          text-align: center;
          font-weight: 500;
          line-height: 1.45;
          margin-bottom: 24px;
        }

        /* ── Submit Button (Vibrant Green Pill) ── */
        .auth-submit-btn {
          width: 100%;
          background: #4AA41B;
          color: #FFFFFF;
          border: none;
          border-radius: 9999px;
          padding: 13px 20px;
          font-size: 0.92rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(74, 164, 27, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background: #3F9216;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(74, 164, 27, 0.45);
        }
        .auth-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .auth-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* ── Divider ── */
        .auth-divider-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 18px 0;
          color: #9A8E85;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .auth-divider-pill::before,
        .auth-divider-pill::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E8DFD8;
        }

        /* ── Google SSO Button ── */
        .auth-google-btn {
          width: 100%;
          background: #FFFFFF;
          color: #2D241E;
          border: 1px solid #E8DFD8;
          border-radius: 9999px;
          padding: 12px 18px;
          font-size: 0.88rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }
        .auth-google-btn:hover:not(:disabled) {
          background: #FAF6F0;
          border-color: #D6CCC2;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
        }
        .auth-google-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Bottom Account Switcher ── */
        .auth-switch-text {
          text-align: center;
          margin-top: 22px;
          font-size: 0.82rem;
          color: #786C62;
          font-weight: 500;
        }
        .auth-switch-btn {
          background: none;
          border: none;
          color: #4AA41B;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          font-size: inherit;
          font-family: inherit;
          transition: opacity 0.15s;
        }
        .auth-switch-btn:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        /* ── Strength bar ── */
        .strength-bar-track {
          height: 4px;
          border-radius: 4px;
          background: #E8DFD8;
          overflow: hidden;
          margin-top: 8px;
        }
        .strength-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease;
          animation: strengthGrow 0.4s ease forwards;
        }

        /* ── Alerts ── */
        .auth-alert {
          border-radius: 12px;
          padding: 11px 14px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 16px;
          line-height: 1.45;
          animation: authFadeIn 0.2s ease;
        }
        .auth-alert-error {
          background: #FEE2E2;
          color: #DC2626;
          border: 1px solid rgba(220, 38, 38, 0.15);
        }
        .auth-alert-success {
          background: #DCFCE7;
          color: #16A34A;
          border: 1px solid rgba(22, 163, 74, 0.15);
        }

        /* ── Legal / Disclaimers Footer ── */
        .auth-legal-footer {
          margin-top: 22px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
        }
        .auth-legal-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 0.72rem;
          color: #9A8E85;
        }
        .auth-legal-btn {
          background: none;
          border: none;
          color: #786C62;
          cursor: pointer;
          font-size: inherit;
          padding: 0;
          text-decoration: underline;
          font-family: inherit;
        }
        .auth-legal-btn:hover {
          color: #1F1914;
        }

        /* ── Responsive Mobile Overhaul ── */
        @media (max-width: 992px) {
          .auth-root {
            background-image: none !important;
            background: #FFF7F0 !important;
            height: auto !important;
            min-height: 100vh !important;
            max-height: none !important;
            overflow-y: auto !important;
            align-items: flex-start !important;
          }
          .auth-inner {
            height: auto !important;
            min-height: 100vh !important;
            max-height: none !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            padding: 24px 20px 36px !important;
            gap: 12px !important;
            overflow: visible !important;
            max-width: 440px !important;
          }
          .auth-left {
            height: auto !important;
            max-height: none !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
            margin-bottom: 0 !important;
          }
          .auth-topbar-left {
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
          .auth-back-pill {
            background: #FFFFFF !important;
            color: #2D241E !important;
            border: 1px solid #E8DFD8 !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
          }
          .auth-back-pill:hover {
            background: #FAF6F0 !important;
            border-color: #D6CCC2 !important;
          }
          .auth-brand-name {
            color: #1F1914 !important;
          }
          .auth-quote-area {
            display: none !important;
          }
          .auth-bottom-badges {
            display: none !important;
          }
          .auth-right {
            justify-content: center !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
          }
          .auth-card-sprout {
            background: #FFF7F0 !important;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid rgba(0, 0, 0, 0.04) !important;
            padding: 36px 28px 30px !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow-y: visible !important;
            border-radius: 28px !important;
          }
          .auth-card-title {
            font-size: 1.45rem !important;
            margin-bottom: 4px !important;
          }
          .auth-card-subtitle {
            font-size: 0.82rem !important;
            margin-bottom: 20px !important;
          }
        }

        /* TaxWise auth refresh */
        .auth-root {
          --auth-bg: #F3F6F5;
          --auth-surface: #FFFFFF;
          --auth-text: #10213C;
          --auth-label: #35445B;
          --auth-muted: #68778D;
          --auth-border: #DCE4E8;
          --auth-field: #FFFFFF;
          --auth-accent: #147D6C;
          --auth-accent-hover: #106858;
          --auth-success: #16805F;
          --auth-otp-filled: #E8F5F1;
          min-height: 100dvh;
          height: auto;
          width: 100%;
          max-height: none;
          overflow-x: hidden;
          overflow-y: auto;
          background: var(--auth-bg);
          background-image: radial-gradient(ellipse at 16% 18%, rgba(20, 125, 108, 0.08), transparent 34%);
        }
        .dark .auth-root {
          --auth-bg: #080F1D;
          --auth-surface: #111B2C;
          --auth-text: #ECF2FA;
          --auth-label: #C5D1E0;
          --auth-muted: #91A0B5;
          --auth-border: #2A394D;
          --auth-field: #0C1524;
          --auth-accent: #35B49A;
          --auth-accent-hover: #27977F;
          --auth-success: #4CC9A6;
          --auth-otp-filled: #153B38;
        }
        .auth-inner {
          width: min(100%, 1440px);
          max-width: 1440px;
          min-height: 100dvh;
          height: auto;
          max-height: none;
          padding: clamp(20px, 3.5vw, 48px);
          gap: clamp(24px, 5vw, 72px);
          justify-content: center;
          overflow: visible;
        }
        .auth-left {
          position: relative;
          isolation: isolate;
          flex: 1.15;
          max-width: none;
          min-height: min(700px, calc(100dvh - 72px));
          height: auto;
          max-height: none;
          padding: clamp(28px, 4vw, 54px);
          box-sizing: border-box;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          background: linear-gradient(145deg, #102447 0%, #0E2A3C 56%, #105B52 100%);
          box-shadow: 0 24px 64px rgba(15, 32, 68, 0.18);
        }
        .auth-left::before,
        .auth-left::after {
          content: "";
          position: absolute;
          z-index: 0;
          pointer-events: none;
          border-radius: 999px;
        }
        .auth-left::before {
          width: 460px;
          height: 460px;
          right: -210px;
          top: -180px;
          border: 1px solid rgba(111, 218, 190, 0.18);
          box-shadow: 0 0 0 34px rgba(111, 218, 190, 0.035), 0 0 0 78px rgba(111, 218, 190, 0.025);
        }
        .auth-left::after {
          width: 360px;
          height: 360px;
          left: -220px;
          bottom: -250px;
          background: radial-gradient(circle, rgba(20, 125, 108, 0.3), transparent 70%);
        }
        .auth-left > * { position: relative; z-index: 1; }
        .auth-topbar-left { justify-content: space-between; gap: 14px; }
        .auth-back-pill { border-radius: 9px; padding: 9px 13px; }
        .auth-quote-area { max-width: 580px; margin: 38px 0; }
        .auth-quote-title {
          max-width: 570px;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          font-size: clamp(2.2rem, 3.3vw, 3.35rem);
          line-height: 1.12;
          letter-spacing: -0.045em;
          text-shadow: none;
        }
        .auth-quote-subtitle { max-width: 500px; font-size: 1rem; color: rgba(241, 247, 251, 0.82); text-shadow: none; }
        .auth-compliance-chip { border-radius: 9px; background: rgba(255,255,255,0.07); }
        .auth-right { flex: 0.95; width: min(100%, 500px); max-height: none; justify-content: center; }
        .auth-card-sprout {
          max-width: 500px;
          max-height: calc(100dvh - 64px);
          padding: clamp(30px, 3vw, 42px);
          border: 1px solid var(--auth-border);
          border-radius: 20px;
          background: var(--auth-surface);
          color: var(--auth-text);
          box-shadow: 0 20px 56px rgba(15, 32, 68, 0.12), 0 2px 8px rgba(15, 32, 68, 0.04);
          scrollbar-color: rgba(20, 125, 108, 0.35) transparent;
        }
        .auth-card-title { color: var(--auth-text); font-size: 1.55rem; text-align: left; letter-spacing: -0.035em; }
        .auth-card-subtitle { color: var(--auth-muted); text-align: left; margin-bottom: 26px; }
        .auth-root input:not([type="checkbox"]),
        .auth-root select { background-color: var(--auth-field) !important; color: var(--auth-text) !important; }
        .auth-root input::placeholder { color: var(--auth-muted); opacity: 0.78; }
        .auth-root label { color: var(--auth-label) !important; }
        .auth-root button:focus-visible,
        .auth-root input:focus-visible,
        .auth-root select:focus-visible { outline: 3px solid rgba(20, 125, 108, 0.3); outline-offset: 2px; }
        .dark .auth-root button:focus-visible,
        .dark .auth-root input:focus-visible,
        .dark .auth-root select:focus-visible { outline-color: rgba(53, 180, 154, 0.42); }
        .auth-submit-btn {
          border-radius: 10px;
          background: var(--auth-accent);
          box-shadow: 0 6px 16px rgba(20, 125, 108, 0.2);
          transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .auth-submit-btn:hover:not(:disabled) { background: var(--auth-accent-hover); box-shadow: 0 9px 20px rgba(20, 125, 108, 0.24); }
        .auth-google-btn { border-radius: 10px; border-color: var(--auth-border); background: var(--auth-surface); color: var(--auth-text); }
        .auth-google-btn:hover:not(:disabled) { background: var(--auth-bg); border-color: var(--auth-muted); }
        .auth-switch-text { color: var(--auth-muted); }
        .auth-switch-btn,
        .auth-legal-btn { color: var(--auth-accent); }
        .auth-legal-footer { border-top: 1px solid var(--auth-border); padding-top: 17px; }
        .auth-legal-links,
        .auth-divider-pill { color: var(--auth-muted); }
        .dark .auth-alert-error { background: #3B2028; color: #FFB4B4; border-color: #69313A; }
        .dark .auth-alert-success { background: #153B32; color: #8BE0BF; border-color: #23634F; }
        .auth-divider-pill::before,
        .auth-divider-pill::after { background: var(--auth-border); }
        .strength-bar-track { background: var(--auth-border); }
        .auth-mode-panel { animation: authModeEnter 380ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes authModeEnter {
          from { opacity: 0; transform: translateY(12px); filter: blur(2px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-mode-panel { animation: none; }
          .auth-root *, .auth-root *::before, .auth-root *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
        }
        @media (max-width: 992px) {
          .auth-root {
            height: auto !important;
            min-height: 100dvh !important;
            max-height: none !important;
            width: 100% !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            align-items: stretch !important;
            background: var(--auth-bg) !important;
          }
          .auth-inner {
            width: min(100%, 560px) !important;
            min-height: 100dvh !important;
            height: auto !important;
            max-height: none !important;
            padding: 18px 16px 30px !important;
            gap: 16px !important;
            overflow: visible !important;
          }
          .auth-left {
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            max-width: none !important;
            padding: 20px !important;
            border-radius: 16px !important;
            overflow: hidden !important;
          }
          .auth-topbar-left { justify-content: space-between !important; }
          .auth-back-pill { padding: 8px 10px !important; font-size: 0.76rem !important; }
          .auth-brand-name { color: #FFFFFF !important; }
          .auth-quote-area { display: block !important; margin: 24px 0 8px !important; }
          .auth-quote-title { font-size: clamp(1.65rem, 7vw, 2.15rem) !important; line-height: 1.15 !important; margin-bottom: 9px !important; }
          .auth-quote-subtitle { font-size: 0.9rem !important; }
          .auth-bottom-badges { display: flex !important; gap: 7px !important; margin-top: 18px !important; }
          .auth-compliance-chip { padding: 8px 10px !important; font-size: 0.68rem !important; }
          .auth-bottom-badges > div:last-child { font-size: 0.66rem !important; }
          .auth-right { width: 100% !important; height: auto !important; max-height: none !important; justify-content: center !important; }
          .auth-card-sprout {
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 26px 22px 22px !important;
            border-radius: 16px !important;
            background: var(--auth-surface) !important;
            border: 1px solid var(--auth-border) !important;
            box-shadow: 0 12px 30px rgba(15, 32, 68, 0.08) !important;
          }
          .auth-card-title { font-size: 1.4rem !important; margin-bottom: 5px !important; }
          .auth-card-subtitle { font-size: 0.82rem !important; margin-bottom: 20px !important; }
        }
      `}</style>

      <div className="auth-inner">
        {/* ══════════════════════════════════════════════════════════
            LEFT — BRANDING & INSPIRING HEADLINE
        ══════════════════════════════════════════════════════════ */}
        <div className="auth-left">
          {/* Top Brand & Back to Home */}
          <div className="auth-topbar-left">
            {onBack ? (
              <button type="button" onClick={onBack} className="auth-back-pill">
                <ArrowLeft size={14} />
                <span>Back to Home</span>
              </button>
            ) : <div />}

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, background: "#35B49A", borderRadius: 2, transform: "rotate(45deg)", boxShadow: "0 0 10px rgba(53, 180, 154, 0.45)" }} />
              <span className="auth-brand-name" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                Tax<span style={{ color: "#62D2B5" }}>Wise</span>
              </span>
            </div>
          </div>

          {/* Centerpiece Typography matching user choice */}
          <div className="auth-quote-area">
            <h1 className="auth-quote-title">
              Precision in every precedent,<br />clarity in every tax position
            </h1>
            <p className="auth-quote-subtitle">
              {mode === "login" && "Log in to access your statutory tax intelligence workspace."}
              {mode === "signup" && "Join leading Ugandan practitioners and start analyzing cases."}
              {mode === "forgot" && "Enter your email to receive a reset code and link."}
              {mode === "reset-code" && "Enter your verification code and set your new password."}
              {mode === "verify-signup" && "Enter your activation code to complete verification."}
              {mode === "update-password" && "Save your new password to regain access."}
            </p>
          </div>

          {/* Bottom Security / Compliance Badges */}
          <div className="auth-bottom-badges">
            <div className="auth-compliance-chip">
              <ShieldCheck size={16} style={{ color: "#62D2B5", flexShrink: 0 }} />
              <span>URA Tax Procedures Code Act 2014 &amp; TAT Statutory Compliance</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.72)", paddingLeft: 4 }}>
              <Lock size={12} style={{ color: "#62D2B5", flexShrink: 0 }} />
              <span>256-Bit SSL Encrypted · Uganda Data Protection &amp; Privacy Act 2019</span>
            </div>
          </div>
        </div>
        {/* ══════════════════════════════════════════════════════════
            RIGHT — WARM IVORY FLOATING CARD
        ══════════════════════════════════════════════════════════ */}
        <div className="auth-right">
          <div className="auth-card-sprout">
            <div key={mode} className="auth-mode-panel">

            {/* ── Mode: Forgot Password Step 1 ── */}
            {mode === "forgot" && (
              <div>
                <h2 className="auth-card-title">Forgot your password?</h2>
                <p className="auth-card-subtitle">
                  Enter your email address and we&apos;ll send you a reset code &amp; link.
                </p>

                <FormField label="Email" required error={fieldErrors.email} icon={<Mail size={16} />}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })); }}
                    placeholder="Enter your email"
                    style={inputStyle(!!fieldErrors.email)}
                  />
                </FormField>

                {globalError && <div className="auth-alert auth-alert-error">{globalError}</div>}
                {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="auth-submit-btn"
                >
                  {loading ? "Sending..." : "Send Reset Code & Link"}
                </button>

                <div className="auth-switch-text">
                  Remembered your password?{" "}
                  <button type="button" onClick={() => switchMode("login")} className="auth-switch-btn">
                    Log in
                  </button>
                </div>
              </div>
            )}

            {/* ── Mode: Reset Code Step 2 ── */}
            {mode === "reset-code" && (
              <div>
                <h2 className="auth-card-title">Reset your password</h2>
                <p className="auth-card-subtitle">
                  Enter the 5-digit code sent to <strong style={{ color: "var(--auth-text)" }}>{email}</strong> and set your new password.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#4B4037", marginBottom: 8, textAlign: "center" }}>
                    Verification Code
                  </label>
                  <OtpInput
                    length={5}
                    value={otpCode}
                    onChange={(v) => { setOtpCode(v); setFieldErrors(f => ({ ...f, otp: undefined })); }}
                    error={fieldErrors.otp}
                    alphanumeric={false}
                  />
                </div>

                <div style={{ textAlign: "center", marginBottom: 16, marginTop: 4 }}>
                  <button
                    type="button"
                    className="auth-switch-btn"
                    style={{ fontSize: "0.78rem" }}
                    onClick={handleResendResetCode}
                    disabled={resendLoading}
                  >
                    {resendLoading ? "Sending..." : "Resend code"}
                  </button>
                </div>

                <PasswordField
                  label="New Password"
                  value={newPassword}
                  onChange={(v) => { setNewPassword(v); setFieldErrors(f => ({ ...f, newPassword: undefined })); }}
                  error={fieldErrors.newPassword}
                  required
                  showStrength
                />

                <ConfirmPasswordField
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  matchValue={newPassword}
                  onChange={(v) => { setConfirmNewPassword(v); setFieldErrors(f => ({ ...f, confirmNewPassword: undefined })); }}
                  error={fieldErrors.confirmNewPassword}
                  required
                />

                {globalError && <div className="auth-alert auth-alert-error">{globalError}</div>}
                {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}

                <button
                  type="button"
                  onClick={handleResetWithCode}
                  disabled={loading || otpCode.length < 5}
                  className="auth-submit-btn"
                >
                  {loading ? "Resetting..." : "Save New Password"}
                </button>

                <div className="auth-switch-text">
                  <button type="button" onClick={() => switchMode("login")} className="auth-switch-btn">
                    ← Back to Log In
                  </button>
                </div>
              </div>
            )}

            {/* ── Mode: Verify Signup OTP ── */}
            {mode === "verify-signup" && (
              <div>
                <h2 className="auth-card-title">Verify your email</h2>
                <p className="auth-card-subtitle">
                  We sent a 5-digit verification code to <strong style={{ color: "var(--auth-text)" }}>{email}</strong>.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <OtpInput
                    length={5}
                    value={otpCode}
                    onChange={(v) => { setOtpCode(v); setFieldErrors(f => ({ ...f, otp: undefined })); }}
                    error={fieldErrors.otp}
                    alphanumeric={false}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={handleResendSignupCode}
                    disabled={resendLoading}
                    className="auth-switch-btn"
                    style={{ fontSize: "0.8rem" }}
                  >
                    {resendLoading ? "Sending..." : "Resend code"}
                  </button>
                </div>

                {globalError && <div className="auth-alert auth-alert-error">{globalError}</div>}
                {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}

                <button
                  type="button"
                  onClick={handleVerifySignup}
                  disabled={loading || otpCode.length < 5}
                  className="auth-submit-btn"
                >
                  {loading ? "Verifying..." : "Verify & Activate Account"}
                </button>

                <div className="auth-switch-text">
                  <button type="button" onClick={() => switchMode("signup")} className="auth-switch-btn">
                    ← Change email / Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Mode: Update Password (from link) ── */}
            {mode === "update-password" && (
              <div>
                <h2 className="auth-card-title">Set new password</h2>
                <p className="auth-card-subtitle">
                  Please enter and confirm your new password below.
                </p>

                <PasswordField
                  label="New Password"
                  value={newPassword}
                  onChange={(v) => { setNewPassword(v); setFieldErrors(f => ({ ...f, newPassword: undefined })); }}
                  error={fieldErrors.newPassword}
                  required
                  showStrength
                />

                <ConfirmPasswordField
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  matchValue={newPassword}
                  onChange={(v) => { setConfirmNewPassword(v); setFieldErrors(f => ({ ...f, confirmNewPassword: undefined })); }}
                  error={fieldErrors.confirmNewPassword}
                  required
                />

                {globalError && <div className="auth-alert auth-alert-error">{globalError}</div>}
                {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}

                <button
                  type="button"
                  onClick={handleUpdatePasswordOnly}
                  disabled={loading}
                  className="auth-submit-btn"
                >
                  {loading ? "Saving..." : "Save New Password"}
                </button>

                <div className="auth-switch-text">
                  <button type="button" onClick={() => switchMode("login")} className="auth-switch-btn">
                    ← Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Mode: Login or Signup ── */}
            {(mode === "login" || mode === "signup") && (
              <div>
                <h2 className="auth-card-title">
                  {mode === "login" ? "Log in to your account" : "Create your account"}
                </h2>
                <p className="auth-card-subtitle">
                  {mode === "login"
                    ? "Welcome back! Please enter your details."
                    : "Join TaxWise to streamline your statutory tax workflows."}
                </p>

                {/* Signup: Full Name */}
                {mode === "signup" && (
                  <FormField label="Full Name" required error={fieldErrors.name} icon={<User size={16} />}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setFieldErrors(f => ({ ...f, name: undefined })); }}
                      placeholder="e.g. Brenda Akello"
                      style={inputStyle(!!fieldErrors.name)}
                    />
                  </FormField>
                )}

                {/* Email Address */}
                <FormField label="Email" required error={fieldErrors.email} icon={<Mail size={16} />}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })); }}
                    placeholder="Enter your email"
                    style={inputStyle(!!fieldErrors.email)}
                  />
                </FormField>

                {/* Password with Eye toggle & right-aligned Forgot password */}
                <PasswordField
                  label="Password"
                  value={password}
                  onChange={(v) => { setPassword(v); setFieldErrors(f => ({ ...f, password: undefined })); }}
                  error={fieldErrors.password}
                  required
                  placeholder="••••••••"
                  showStrength={mode === "signup"}
                  showForgot={mode === "login"}
                  onForgot={() => switchMode("forgot")}
                />

                {/* Signup: Confirm Password */}
                {mode === "signup" && (
                  <ConfirmPasswordField
                    label="Confirm Password"
                    value={confirmPassword}
                    matchValue={password}
                    onChange={(v) => { setConfirmPassword(v); setFieldErrors(f => ({ ...f, confirmPassword: undefined })); }}
                    error={fieldErrors.confirmPassword}
                    required
                  />
                )}

                {/* Signup: Professional Role */}
                {mode === "signup" && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--auth-label)", marginBottom: 6 }}>
                      Professional Role <span style={{ color: "#E04838" }}>*</span>
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px solid rgba(0, 0, 0, 0.05)",
                        borderRadius: 14,
                        padding: "13px 16px",
                        fontSize: "0.88rem",
                        fontFamily: "inherit",
                        background: "#FFFFFF",
                        color: "#1F2937",
                        fontWeight: 500,
                        outline: "none",
                        cursor: "pointer",
                        boxSizing: "border-box",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                      }}
                    >
                      {["Tax Consultant", "Accountant", "Tax Lawyer", "Finance Manager", "Business Owner", "Student"].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Signup: Terms agreement */}
                {mode === "signup" && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <input
                        type="checkbox"
                        id="agreeTerms"
                        checked={agreeTerms}
                        onChange={(e) => { setAgreeTerms(e.target.checked); setFieldErrors(f => ({ ...f, agreeTerms: undefined })); }}
                        style={{ accentColor: "var(--auth-accent)", marginTop: 2, cursor: "pointer", width: 15, height: 15 }}
                      />
                      <label htmlFor="agreeTerms" style={{ fontSize: "0.78rem", color: "var(--auth-muted)", cursor: "pointer", lineHeight: 1.45 }}>
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={() => { setLegalTab("terms"); setLegalOpen(true); }}
                          style={{ background: "none", border: "none", color: "var(--auth-accent)", fontWeight: 600, cursor: "pointer", padding: 0 }}
                        >
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          onClick={() => { setLegalTab("privacy"); setLegalOpen(true); }}
                          style={{ background: "none", border: "none", color: "var(--auth-accent)", fontWeight: 600, cursor: "pointer", padding: 0 }}
                        >
                          Privacy Policy
                        </button>
                      </label>
                    </div>
                    {fieldErrors.agreeTerms && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: "0.74rem", color: "#DC2626", fontWeight: 600 }}>
                        <AlertTriangle size={13} /> {fieldErrors.agreeTerms}
                      </div>
                    )}
                  </div>
                )}

                {/* Alerts */}
                {globalError && <div className="auth-alert auth-alert-error">{globalError}</div>}
                {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}

                {/* Primary Action Button (Green Pill) */}
                <button
                  type="button"
                  onClick={handleAuth}
                  disabled={loading}
                  className="auth-submit-btn"
                >
                  {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
                </button>

                {/* Divider */}
                <div className="auth-divider-pill">
                  <span>or</span>
                </div>

                {/* Google SSO Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="auth-google-btn"
                >
                  <GoogleIcon />
                  <span>Sign in with Google</span>
                </button>

                {/* Bottom Switcher */}
                <div className="auth-switch-text">
                  {mode === "login" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("signup")}
                        className="auth-switch-btn"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("login")}
                        className="auth-switch-btn"
                      >
                        Log in
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            </div>
            {/* Legal / Disclaimers Footer */}
            <div className="auth-legal-footer">
              <div className="auth-legal-links">
                <button
                  type="button"
                  onClick={() => { setLegalTab("terms"); setLegalOpen(true); }}
                  className="auth-legal-btn"
                >
                  Terms
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => { setLegalTab("privacy"); setLegalOpen(true); }}
                  className="auth-legal-btn"
                >
                  Privacy
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => { setLegalTab("blog"); setLegalOpen(true); }}
                  className="auth-legal-btn"
                >
                  Legal Disclaimers
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      <LegalPortal isOpen={legalOpen} onClose={() => setLegalOpen(false)} initialTab={legalTab} />
    </div>
  );
};
