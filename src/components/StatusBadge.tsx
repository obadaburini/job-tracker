import { usePreferences } from "../context/PreferencesContext";
import type { ApplicationStatus } from "../types/application";

type StatusBadgeProps = { status: ApplicationStatus };

const statusClasses: Record<ApplicationStatus, string> = {
  Applied: "applied",
  Interview: "interview",
  "Technical Interview": "technical",
  "HR Interview": "hr",
  Offer: "offer",
  Rejected: "rejected",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = usePreferences();
  const labels: Record<ApplicationStatus, string> = {
    Applied: t("applied"),
    Interview: t("interview"),
    "Technical Interview": t("technicalInterview"),
    "HR Interview": t("hrInterview"),
    Offer: t("offer"),
    Rejected: t("rejected"),
  };

  return <span className={`status ${statusClasses[status]}`}>{labels[status]}</span>;
}
