import { useMemo, useState } from "react";

import ApplicationTable from "../components/ApplicationTable";
import { useApplications } from "../context/ApplicationContext";
import { usePreferences } from "../context/PreferencesContext";
import type { ApplicationStatus } from "../types/application";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Applied",
  "Interview",
  "Technical Interview",
  "HR Interview",
  "Offer",
  "Rejected",
];

type StatusFilter = ApplicationStatus | "All";

export default function Applications() {
  const { applications, setApplications } = useApplications();
  const { t } = usePreferences();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const statusLabels: Record<ApplicationStatus, string> = {
    Applied: t("applied"), Interview: t("interview"),
    "Technical Interview": t("technicalInterview"),
    "HR Interview": t("hrInterview"), Offer: t("offer"), Rejected: t("rejected"),
  };

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch = [
        application.company,
        application.position,
        application.location,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesStatus =
        statusFilter === "All" || application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  function handleDelete(id: number) {
    if (!window.confirm(t("confirmDelete"))) {
      return;
    }

    setApplications((currentApplications) =>
      currentApplications.filter((application) => application.id !== id),
    );
  }

  return (
    <main className="main-content">
      <div className="page-header">
        <div>
          <h1>{t("applications")}</h1>
          <p>{t("manageDescription")}</p>
        </div>
      </div>

      <div className="search-container">
        <input
          className="search-input"
          type="search"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search applications"
        />
      </div>

      <div className="filter-container">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as StatusFilter)
          }
          aria-label="Filter applications by status"
        >
          <option value="All">{t("allStatuses")}</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <ApplicationTable
        applications={filteredApplications}
        onDelete={handleDelete}
        onEdit={() => undefined}
      />
    </main>
  );
}
