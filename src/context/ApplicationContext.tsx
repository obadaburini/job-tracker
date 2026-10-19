import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { applications as initialApplications } from "../data/applications";
import type { JobApplication } from "../types/application";

const STORAGE_KEY = "applications";

type ApplicationContextValue = {
  applications: JobApplication[];
  setApplications: Dispatch<SetStateAction<JobApplication[]>>;
};

type ApplicationProviderProps = {
  children: ReactNode;
};

const ApplicationContext = createContext<ApplicationContextValue | undefined>(
  undefined,
);

function loadApplications(): JobApplication[] {
  try {
    const storedApplications = localStorage.getItem(STORAGE_KEY);

    return storedApplications
      ? (JSON.parse(storedApplications) as JobApplication[])
      : initialApplications;
  } catch {
    return initialApplications;
  }
}

export function ApplicationProvider({ children }: ApplicationProviderProps) {
  const [applications, setApplications] =
    useState<JobApplication[]>(loadApplications);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  return (
    <ApplicationContext.Provider value={{ applications, setApplications }}>
      {children}
    </ApplicationContext.Provider>
  );
}

// The context hook is intentionally colocated with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useApplications(): ApplicationContextValue {
  const context = useContext(ApplicationContext);

  if (context === undefined) {
    throw new Error("useApplications must be used within ApplicationProvider");
  }

  return context;
}
