import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";

type VerificationState = { email?: string; issuedAt?: number; emailDelivery?: string; message?: string };

export default function VerifyEmail() {
  const { verifyEmail, resendVerification } = useAuth();
  const { language } = usePreferences();
  const { state } = useLocation();
  const initial = (state ?? {}) as VerificationState;
  const [email, setEmail] = useState(initial.email ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"verify" | "resend" | null>(null);
  const [error, setError] = useState(initial.emailDelivery === "failed" ? initial.message ?? "Unable to send your code. Please resend shortly." : "");
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState(false);
  const [issuedAt, setIssuedAt] = useState(initial.issuedAt ?? 0);
  const [now, setNow] = useState(() => Date.now());
  const isArabic = language === "ar";
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const cooldown = Math.max(0, Math.ceil((issuedAt + 60000 - now) / 1000));
  const remaining = Math.max(0, Math.ceil((issuedAt + 600000 - now) / 1000));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return;
    setBusy("verify"); setError(""); setNotice("");
    try { await verifyEmail(email.trim(), code); setSuccess(true); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to verify code"); }
    finally { setBusy(null); }
  }

  async function resend() {
    setBusy("resend"); setError(""); setNotice("");
    try {
      const result = await resendVerification(email.trim());
      setNotice(result.message); setCode(""); setIssuedAt(Date.now()); setNow(Date.now());
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to resend code"); }
    finally { setBusy(null); }
  }

  return <main className="auth-page">
    <section className="auth-card auth-message-card otp-card" aria-busy={busy !== null}>
      <div className="auth-brand">{success ? "✓" : "JT"}</div>
      <h1>{success ? (isArabic ? "تم تفعيل حسابك" : "Email verified") : (isArabic ? "تحقق من بريدك" : "Verify your email")}</h1>
      {success ? <><p>{isArabic ? "يمكنك الآن تسجيل الدخول." : "Your account is ready. You can now sign in."}</p><p className="auth-switch"><Link to="/login">Sign in</Link></p></> : <>
        <p>{isArabic ? "أدخل الرمز المكون من 6 أرقام الذي أرسلناه إلى بريدك الإلكتروني." : "Enter the 6-digit code we sent to your email."}</p>
        <form onSubmit={submit}>
          <label htmlFor="verification-email">{isArabic ? "البريد الإلكتروني" : "Email address"}</label>
          <input id="verification-email" type="email" autoComplete="email" value={email} onChange={event => { setEmail(event.target.value); setCode(""); }} required disabled={busy !== null} />
          <label htmlFor="verification-code">{isArabic ? "رمز التحقق" : "Verification code"}</label>
          <input id="verification-code" className="otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            onPaste={event => { event.preventDefault(); setCode(event.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6)); }} placeholder="000000" aria-describedby="otp-expiry" required disabled={busy !== null} />
          <small id="otp-expiry">{issuedAt ? (remaining ? `Code window: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} remaining` : "Code expired. Request a new code.") : "Codes expire after 10 minutes. You can request a new code below."}</small>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-success" role="status">{notice}</p>}
          <button className="auth-submit" disabled={busy !== null || code.length !== 6}>{busy === "verify" ? "Verifying…" : (isArabic ? "تأكيد الرمز" : "Verify email")}</button>
          <button className="otp-resend" type="button" onClick={resend} disabled={busy !== null || cooldown > 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}>{busy === "resend" ? "Sending…" : cooldown ? `Resend code in ${cooldown}s` : (isArabic ? "إعادة إرسال الرمز" : "Resend code")}</button>
        </form>
        <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
      </>}
    </section>
  </main>;
}
