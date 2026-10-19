import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";

export default function Register() {
  const { user, register } = useAuth();
  const { language } = usePreferences();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isArabic = language === "ar";

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const delivery = await register({ companyName, name, email, password });
      navigate("/verify-email", { replace: true, state: { ...delivery, issuedAt: Date.now() } });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">JT</div>
        <h1>{isArabic ? "أنشئ مساحة شركتك" : "Create your company"}</h1>
        <p>{isArabic ? "سيتم إنشاء أول حساب بصلاحية مدير" : "Your first account will be the manager"}</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="company-name">{isArabic ? "اسم الشركة" : "Company name"}</label>
          <input id="company-name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required minLength={2} />

          <label htmlFor="manager-name">{isArabic ? "اسم المدير" : "Manager name"}</label>
          <input id="manager-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} autoComplete="name" />

          <label htmlFor="register-email">{isArabic ? "البريد الإلكتروني" : "Email"}</label>
          <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />

          <label htmlFor="register-password">{isArabic ? "كلمة المرور" : "Password"}</label>
          <input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" />
          <small>{isArabic ? "8 أحرف على الأقل" : "At least 8 characters"}</small>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "..." : isArabic ? "إنشاء الحساب" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          {isArabic ? "لديك حساب؟" : "Already have an account?"}{" "}
          <Link to="/login">{isArabic ? "سجّل الدخول" : "Sign in"}</Link>
        </p>
      </section>
    </main>
  );
}
