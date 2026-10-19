import { useState, type FormEvent } from "react";
import { usePreferences } from "../context/PreferencesContext";

import type {
  ApplicationStatus,
  JobApplication,
} from "../types/application";

type AddApplicationModalProps = {
  isOpen: boolean;
  applicationToEdit: JobApplication | null;
  onClose: () => void;
  onAdd: (application: JobApplication) => void;
  onUpdate: (application: JobApplication) => void;
};

type ApplicationFormProps = Omit<AddApplicationModalProps, "isOpen">;

function ApplicationForm({
  applicationToEdit,
  onClose,
  onAdd,
  onUpdate,
}: ApplicationFormProps) {
  const { t } = usePreferences();
  const [company, setCompany] = useState(applicationToEdit?.company ?? "");
  const [position, setPosition] = useState(applicationToEdit?.position ?? "");
  const [location, setLocation] = useState(applicationToEdit?.location ?? "");
  const [date, setDate] = useState(applicationToEdit?.date ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(
    applicationToEdit?.status ?? "Applied",
  );

  const isEditing = applicationToEdit !== null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const application: JobApplication = {
      id: applicationToEdit?.id ?? Date.now(),
      company,
      position,
      location,
      date,
      status,
    };

    if (isEditing) {
      onUpdate(application);
    } else {
      onAdd(application);
    }

    onClose();
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? t("editApplication") : t("addNewApplication")}</h2>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label={t("closeModal")}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="company">{t("company")}</label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder={t("exampleCompany")}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="position">{t("position")}</label>
            <input
              id="position"
              type="text"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              placeholder={t("examplePosition")}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">{t("location")}</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder={t("exampleLocation")}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">{t("date")}</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">{t("status")}</label>
            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ApplicationStatus)
              }
            >
              <option value="Applied">{t("applied")}</option>
              <option value="Interview">{t("interview")}</option>
              <option value="Technical Interview">{t("technicalInterview")}</option>
              <option value="HR Interview">{t("hrInterview")}</option>
              <option value="Offer">{t("offer")}</option>
              <option value="Rejected">{t("rejected")}</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              {t("cancel")}
            </button>
            <button type="submit" className="save-button">
              {isEditing ? t("saveChanges") : t("saveApplication")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddApplicationModal({
  isOpen,
  applicationToEdit,
  onClose,
  onAdd,
  onUpdate,
}: AddApplicationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ApplicationForm
      key={applicationToEdit?.id ?? "new-application"}
      applicationToEdit={applicationToEdit}
      onClose={onClose}
      onAdd={onAdd}
      onUpdate={onUpdate}
    />
  );
}
