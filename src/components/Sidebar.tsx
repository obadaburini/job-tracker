import { NavLink } from "react-router-dom";

import { usePreferences } from "../context/PreferencesContext";

const navigationLinks = [
  { to: "/", label: "dashboard", icon: "📊", end: true },
  { to: "/applications", label: "applications", icon: "💼", end: false },
  { to: "/statistics", label: "statistics", icon: "📈", end: false },
  { to: "/settings", label: "settings", icon: "⚙", end: false },
] as const;

export default function Sidebar() {
  const { t } = usePreferences();

  return (
    <aside className="sidebar">
      {navigationLinks.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `menu-item${isActive ? " active" : ""}`
          }
        >
          <span aria-hidden="true">{icon}</span> {t(label)}
        </NavLink>
      ))}
    </aside>
  );
}
