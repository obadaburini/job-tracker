import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Shared by components that render server-hosted avatar URLs.
// eslint-disable-next-line react-refresh/only-export-components
export const API_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "") || "/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "MANAGER" | "RECRUITER";
  companyId: string;
  company: { name: string };
  avatarUrl: string | null;
  emailVerified: boolean;
};

type LoginInput = { email: string; password: string };
type RegisterInput = LoginInput & { name: string; companyName: string };

export type VerificationDelivery = { email: string; emailDelivery: string; message: string; resendAfterSeconds: number };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<VerificationDelivery>;
  logout: () => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<{ message: string; resendAfterSeconds: number }>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: options?.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new Error("Unable to reach the API. Check that the backend is running on port 4000 and the frontend on port 5173.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Unable to connect to the server");
  }

  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

async function authRequest(
  path: string,
  options?: RequestInit,
): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>(`/auth${path}`, options);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authRequest("/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(input: LoginInput) {
    const result = await authRequest("/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setUser(result.user);
  }

  async function register(input: RegisterInput) {
    const result = await apiRequest<VerificationDelivery>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return result;
  }

  async function logout() {
    await apiRequest("/auth/logout", {
      method: "POST",
    });
    setUser(null);
  }

  async function verifyEmail(email: string, code: string) {
    await apiRequest("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  }

  async function resendVerification(email: string) {
    return apiRequest<{ message: string; resendAfterSeconds: number }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    const result = await apiRequest<{ avatarUrl: string }>("/profile/avatar", {
      method: "POST",
      body: formData,
    });
    setUser((currentUser) => currentUser ? { ...currentUser, avatarUrl: result.avatarUrl } : null);
  }

  async function removeAvatar() {
    await apiRequest("/profile/avatar", { method: "DELETE" });
    setUser((currentUser) => currentUser ? { ...currentUser, avatarUrl: null } : null);
  }

  return (
    <AuthContext.Provider value={{
      user, isLoading, login, register, logout,
      verifyEmail, resendVerification, uploadAvatar, removeAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// The auth hook is intentionally colocated with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
