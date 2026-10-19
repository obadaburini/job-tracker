declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        companyId: string;
        role: "MANAGER" | "RECRUITER";
      };
    }
  }
}

export {};
