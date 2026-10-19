import { usePreferences } from "../context/PreferencesContext";
import { API_URL, useAuth } from "../context/AuthContext";
import { useState, type ChangeEvent } from "react";

export default function Settings() {
  const { theme, language, setTheme, setLanguage, t } = usePreferences();
  const { user, uploadAvatar, removeAvatar } = useAuth();
  const [avatarError, setAvatarError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setIsUploading(true);
    try {
      await uploadAvatar(file);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <main className="main-content settings-page">
      <div className="page-header">
        <div>
          <h1>{t("settings")}</h1>
          <p>{t("settingsDescription")}</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="settings-card profile-settings-card">
          <div className="settings-avatar">
            {user?.avatarUrl ? (
              <img src={`${API_URL.replace(/\/api$/, "")}${user.avatarUrl}`} alt={user.name} />
            ) : user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="settings-card__content">
            <h2>{language === "ar" ? "الصورة الشخصية" : "Profile photo"}</h2>
            <p>{language === "ar" ? "ارفع صورة اختيارية أو استخدم الحرف الأول من اسمك." : "Upload an optional photo or keep your name initial."}</p>
            <div className="profile-photo-actions">
              <label className="upload-button">
                {isUploading ? "..." : language === "ar" ? "رفع صورة" : "Upload photo"}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} disabled={isUploading} />
              </label>
              {user?.avatarUrl && (
                <button type="button" className="remove-photo-button" onClick={() => void removeAvatar()}>
                  {language === "ar" ? "حذف الصورة" : "Remove photo"}
                </button>
              )}
            </div>
            <small>{language === "ar" ? "JPG أو PNG أو WebP، بحد أقصى 3MB" : "JPG, PNG, or WebP, up to 3MB"}</small>
            {avatarError && <p className="auth-error">{avatarError}</p>}
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card__icon" aria-hidden="true">◐</div>
          <div className="settings-card__content">
            <h2>{t("appearance")}</h2>
            <p>{t("appearanceDescription")}</p>
            <div className="segmented-control">
              <button
                type="button"
                className={theme === "light" ? "selected" : ""}
                onClick={() => setTheme("light")}
              >
                ☀ {t("light")}
              </button>
              <button
                type="button"
                className={theme === "dark" ? "selected" : ""}
                onClick={() => setTheme("dark")}
              >
                ☾ {t("dark")}
              </button>
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card__icon" aria-hidden="true">文</div>
          <div className="settings-card__content">
            <h2>{t("language")}</h2>
            <p>{t("languageDescription")}</p>
            <div className="segmented-control">
              <button
                type="button"
                className={language === "en" ? "selected" : ""}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
              <button
                type="button"
                className={language === "ar" ? "selected" : ""}
                onClick={() => setLanguage("ar")}
              >
                العربية
              </button>
            </div>
          </div>
        </section>
      </div>

      <p className="settings-note">✓ {t("preferencesSaved")}</p>
    </main>
  );
}
