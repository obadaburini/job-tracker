import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";

export default function Login() {
  const { user, login } = useAuth();
  const { language } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isArabic = language === "ar";

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNeedsVerification(false);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      const destination = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;
      navigate(destination ?? "/", { replace: true });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Login failed";

      if (message === "Your account has not been verified yet.") {
        setError(message);
        setNeedsVerification(true);
        return;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">JT</div>
        <h1>{isArabic ? "مرحبًا بعودتك" : "Welcome back"}</h1>
        <p>{isArabic ? "سجّل الدخول لإدارة فريق التوظيف" : "Sign in to manage your hiring team"}</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">{isArabic ? "البريد الإلكتروني" : "Email"}</label>
          <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />

          <label htmlFor="login-password">{isArabic ? "كلمة المرور" : "Password"}</label>
          <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "..." : isArabic ? "تسجيل الدخول" : "Sign in"}
          </button>
        </form>

        {needsVerification && <p className="auth-switch"><Link to="/verify-email" state={{ email }}>Resend verification code</Link></p>}

        <p className="auth-switch">
          {isArabic ? "ليس لديك حساب؟" : "No account yet?"}{" "}
          <Link to="/register">{isArabic ? "أنشئ شركتك" : "Create your company"}</Link>
        </p>
      </section>
    </main>
  );
}
