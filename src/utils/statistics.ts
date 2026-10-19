import type {
  ApplicationStatus,
  JobApplication,
} from "../types/application";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Applied",
  "Interview",
  "Technical Interview",
  "HR Interview",
  "Offer",
  "Rejected",
];

export function getTotalApplications(applications: JobApplication[]): number {
  return applications.length;
}

export function getInterviewCount(applications: JobApplication[]): number {
  return applications.filter(({ status }) => status.includes("Interview")).length;
}

export function getOfferCount(applications: JobApplication[]): number {
  return applications.filter(({ status }) => status === "Offer").length;
}

export function getRejectedCount(applications: JobApplication[]): number {
  return applications.filter(({ status }) => status === "Rejected").length;
}

export function getApplicationsPerStatus(
  applications: JobApplication[],
): Record<ApplicationStatus, number> {
  const counts = Object.fromEntries(
    APPLICATION_STATUSES.map((status) => [status, 0]),
  ) as Record<ApplicationStatus, number>;

  for (const { status } of applications) {
    counts[status] += 1;
  }

  return counts;
}
