import { useEffect, useMemo, useState } from "react";

import AddApplicationModal from "../components/AddApplicationModal";
import ApplicationTable from "../components/ApplicationTable";
import StatCard from "../components/StatCard";
import Toast from "../components/Toast";
import { useApplications } from "../context/ApplicationContext";
import { usePreferences } from "../context/PreferencesContext";
import type {
  ApplicationStatus,
  JobApplication,
} from "../types/application";
import {
  getInterviewCount,
  getOfferCount,
  getRejectedCount,
  getTotalApplications,
} from "../utils/statistics";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Applied",
  "Interview",
  "Technical Interview",
  "HR Interview",
  "Offer",
  "Rejected",
];

type StatusFilter = ApplicationStatus | "All";

export default function Dashboard() {
  const { applications, setApplications } = useApplications();
  const { t } = usePreferences();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicationToEdit, setApplicationToEdit] =
    useState<JobApplication | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [toastMessage, setToastMessage] = useState("");
  const statusLabels: Record<ApplicationStatus, string> = {
    Applied: t("applied"), Interview: t("interview"),
    "Technical Interview": t("technicalInterview"),
    "HR Interview": t("hrInterview"), Offer: t("offer"), Rejected: t("rejected"),
  };

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

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

  function openAddModal() {
    setApplicationToEdit(null);
    setIsModalOpen(true);
  }

  function openEditModal(application: JobApplication) {
    setApplicationToEdit(application);
    setIsModalOpen(true);
  }

  function closeModal() {
    setApplicationToEdit(null);
    setIsModalOpen(false);
  }

  function handleAdd(application: JobApplication) {
    setApplications((currentApplications) => [
      application,
      ...currentApplications,
    ]);
    setToastMessage(t("addedSuccess"));
  }

  function handleUpdate(updatedApplication: JobApplication) {
    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        application.id === updatedApplication.id
          ? updatedApplication
          : application,
      ),
    );
    setToastMessage(t("updatedSuccess"));
  }

  function handleDelete(id: number) {
    if (!window.confirm(t("confirmDelete"))) {
      return;
    }

    setApplications((currentApplications) =>
      currentApplications.filter((application) => application.id !== id),
    );
    setToastMessage(t("deletedSuccess"));
  }

  return (
    <>
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>{t("dashboard")}</h1>
            <p>{t("trackDescription")}</p>
          </div>

          <button className="add-button" type="button" onClick={openAddModal}>
            + {t("addApplication")}
          </button>
        </div>

        <section className="stats-grid" aria-label={t("applicationStats")}>
          <StatCard
            title={t("applications")}
            value={getTotalApplications(applications)}
            icon="💼"
            color="#2563eb"
          />
          <StatCard
            title={t("interviews")}
            value={getInterviewCount(applications)}
            icon="📅"
            color="#f59e0b"
          />
          <StatCard
            title={t("offers")}
            value={getOfferCount(applications)}
            icon="🎉"
            color="#10b981"
          />
          <StatCard
            title={t("rejected")}
            value={getRejectedCount(applications)}
            icon="✕"
            color="#ef4444"
          />
        </section>

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
          onEdit={openEditModal}
        />
      </main>

      <AddApplicationModal
        isOpen={isModalOpen}
        applicationToEdit={applicationToEdit}
        onClose={closeModal}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
      />

      <Toast message={toastMessage} />
    </>
  );
}
