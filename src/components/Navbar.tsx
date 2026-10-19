import { useNavigate } from "react-router-dom";

import { API_URL, useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, t } = usePreferences();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <h2>{t("appName")}</h2>
        <span className="company-name">{user?.company.name}</span>
      </div>

      <div className="navbar__right">
        <button className="notification-btn" type="button" aria-label="Notifications">
          🔔
        </button>

        <div className="user-profile">
          <div className="avatar">
            {user?.avatarUrl ? (
              <img
                src={`${API_URL.replace(/\/api$/, "")}${user.avatarUrl}`}
                alt={user.name}
              />
            ) : user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">
              {user?.role === "MANAGER"
                ? language === "ar" ? "مدير" : "Manager"
                : language === "ar" ? "موظف توظيف" : "Recruiter"}
            </span>
          </div>
        </div>

        <button className="logout-button" type="button" onClick={handleLogout}>
          {language === "ar" ? "خروج" : "Logout"}
        </button>
      </div>
    </nav>
  );
}
