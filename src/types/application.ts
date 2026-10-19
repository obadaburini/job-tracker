export type ApplicationStatus =
  | "Applied"
  | "Interview"
  | "Technical Interview"
  | "HR Interview"
  | "Offer"
  | "Rejected";

export interface JobApplication {
  id: number;
  company: string;
  position: string;
  location: string;
  date: string;
  status: ApplicationStatus;
}