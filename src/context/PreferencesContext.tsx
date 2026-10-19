import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";
type Language = "en" | "ar";

const translations = {
  en: {
    appName: "Job Tracker",
    dashboard: "Dashboard",
    applications: "Applications",
    statistics: "Statistics",
    settings: "Settings",
    userRole: "Job Seeker",
    settingsDescription: "Customize your experience and display preferences.",
    appearance: "Appearance",
    appearanceDescription: "Choose the theme that is comfortable for you.",
    light: "Light",
    dark: "Dark",
    language: "Language",
    languageDescription: "Choose the interface language and direction.",
    english: "English",
    arabic: "Arabic",
    preferencesSaved: "Your preferences are saved automatically on this device.",
    trackDescription: "Track your job applications in one place.",
    addApplication: "Add Application",
    interviews: "Interviews",
    offers: "Offers",
    rejected: "Rejected",
    searchPlaceholder: "Search company, position, or location...",
    allStatuses: "All Statuses",
    applicationStats: "Application statistics",
    manageDescription: "Manage all your job applications.",
    reviewDescription: "Review the progress of your job applications.",
    applicationsByStatus: "Applications by Status",
    statusOverview: "Status Overview",
    applicationSummary: "Application summary",
    recentApplications: "Recent Applications",
    company: "Company",
    position: "Position",
    location: "Location",
    date: "Date",
    status: "Status",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    noApplications: "No Applications Yet",
    emptyHint: "Click Add Application to create your first application.",
    confirmDelete: "Are you sure you want to delete this application?",
    addedSuccess: "Application added successfully.",
    updatedSuccess: "Application updated successfully.",
    deletedSuccess: "Application deleted successfully.",
    addNewApplication: "Add New Application",
    editApplication: "Edit Application",
    exampleCompany: "Example: Google",
    examplePosition: "Example: Frontend Developer",
    exampleLocation: "Example: Amman",
    cancel: "Cancel",
    saveApplication: "Save Application",
    saveChanges: "Save Changes",
    closeModal: "Close modal",
    applied: "Applied",
    interview: "Interview",
    technicalInterview: "Technical Interview",
    hrInterview: "HR Interview",
    offer: "Offer",
  },
  ar: {
    appName: "متابع التوظيف",
    dashboard: "لوحة التحكم",
    applications: "طلبات التوظيف",
    statistics: "الإحصائيات",
    settings: "الإعدادات",
    userRole: "باحث عن عمل",
    settingsDescription: "خصّص تجربة الاستخدام وتفضيلات العرض.",
    appearance: "المظهر",
    appearanceDescription: "اختر المظهر الأكثر راحة لك.",
    light: "فاتح",
    dark: "داكن",
    language: "اللغة",
    languageDescription: "اختر لغة الواجهة واتجاهها.",
    english: "الإنجليزية",
    arabic: "العربية",
    preferencesSaved: "يتم حفظ تفضيلاتك تلقائيًا على هذا الجهاز.",
    trackDescription: "تابع طلبات التوظيف الخاصة بك في مكان واحد.",
    addApplication: "إضافة طلب",
    interviews: "المقابلات",
    offers: "العروض",
    rejected: "المرفوضة",
    searchPlaceholder: "ابحث عن شركة أو وظيفة أو موقع...",
    allStatuses: "جميع الحالات",
    applicationStats: "إحصائيات الطلبات",
    manageDescription: "أدر جميع طلبات التوظيف الخاصة بك.",
    reviewDescription: "راجع تقدم طلبات التوظيف الخاصة بك.",
    applicationsByStatus: "الطلبات حسب الحالة",
    statusOverview: "نظرة عامة على الحالات",
    applicationSummary: "ملخص الطلبات",
    recentApplications: "أحدث الطلبات",
    company: "الشركة",
    position: "الوظيفة",
    location: "الموقع",
    date: "التاريخ",
    status: "الحالة",
    actions: "الإجراءات",
    edit: "تعديل",
    delete: "حذف",
    noApplications: "لا توجد طلبات",
    emptyHint: "اضغط على إضافة طلب لإنشاء أول طلب توظيف.",
    confirmDelete: "هل أنت متأكد من حذف طلب التوظيف؟",
    addedSuccess: "تمت إضافة الطلب بنجاح.",
    updatedSuccess: "تم تحديث الطلب بنجاح.",
    deletedSuccess: "تم حذف الطلب بنجاح.",
    addNewApplication: "إضافة طلب جديد",
    editApplication: "تعديل الطلب",
    exampleCompany: "مثال: Google",
    examplePosition: "مثال: مطور واجهات",
    exampleLocation: "مثال: عمّان",
    cancel: "إلغاء",
    saveApplication: "حفظ الطلب",
    saveChanges: "حفظ التغييرات",
    closeModal: "إغلاق النافذة",
    applied: "تم التقديم",
    interview: "مقابلة",
    technicalInterview: "مقابلة تقنية",
    hrInterview: "مقابلة موارد بشرية",
    offer: "عرض وظيفي",
  },
} as const;

type TranslationKey = keyof (typeof translations)["en"];

type PreferencesContextValue = {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("theme") === "dark" ? "dark" : "light",
  );
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("language") === "ar" ? "ar" : "en",
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  function t(key: TranslationKey) {
    return translations[language][key];
  }

  return (
    <PreferencesContext.Provider
      value={{ theme, language, setTheme, setLanguage, t }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

// The preferences hook is intentionally colocated with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }

  return context;
}
