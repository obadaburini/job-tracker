import { usePreferences } from "../context/PreferencesContext";
import type { JobApplication } from "../types/application";
import StatusBadge from "./StatusBadge";

type ApplicationTableProps = {
  applications: JobApplication[];
  onDelete: (id: number) => void;
  onEdit: (application: JobApplication) => void;
};

export default function ApplicationTable({
  applications,
  onDelete,
  onEdit,
}: ApplicationTableProps) {
  const { t } = usePreferences();

  return (
    <div className="applications-section">
      <div className="applications-header">
        <h2>{t("recentApplications")}</h2>
        <span>{applications.length} {t("applications")}</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("company")}</th>
              <th>{t("position")}</th>
              <th>{t("location")}</th>
              <th>{t("date")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.company}</td>
                <td>{application.position}</td>
                <td>{application.location}</td>
                <td>{application.date}</td>
                <td><StatusBadge status={application.status} /></td>
                <td className="actions">
                  <button className="edit-button" onClick={() => onEdit(application)}>
                    ✎ {t("edit")}
                  </button>
                  <button className="delete-button" onClick={() => onDelete(application.id)}>
                    🗑 {t("delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {applications.length === 0 && (
          <div className="empty-state">
            <h3>{t("noApplications")}</h3>
            <p>{t("emptyHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
