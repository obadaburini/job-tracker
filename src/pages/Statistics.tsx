import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ChartCard from "../components/ChartCard";
import StatCard from "../components/StatCard";
import { useApplications } from "../context/ApplicationContext";
import { usePreferences } from "../context/PreferencesContext";
import {
  getApplicationsPerStatus,
  getInterviewCount,
  getOfferCount,
  getRejectedCount,
  getTotalApplications,
} from "../utils/statistics";

const STATUS_COLORS: Record<string, string> = {
  Applied: "#2563eb",
  Interview: "#f59e0b",
  "Technical Interview": "#8b5cf6",
  "HR Interview": "#eab308",
  Offer: "#10b981",
  Rejected: "#ef4444",
};

export default function Statistics() {
  const { applications } = useApplications();
  const { t } = usePreferences();

  const chartData = useMemo(() => {
    const applicationsPerStatus = getApplicationsPerStatus(applications);

    const labels: Record<string, string> = {
      Applied: t("applied"), Interview: t("interview"),
      "Technical Interview": t("technicalInterview"),
      "HR Interview": t("hrInterview"), Offer: t("offer"), Rejected: t("rejected"),
    };

    return Object.entries(applicationsPerStatus).map(([status, count]) => ({
      status, label: labels[status], count,
    }));
  }, [applications, t]);

  return (
    <main className="main-content">
      <div className="page-header">
        <div>
          <h1>{t("statistics")}</h1>
          <p>{t("reviewDescription")}</p>
        </div>
      </div>

      <section className="statistics-summary" aria-label={t("applicationSummary")}>
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

      <div className="statistics-charts">
        <ChartCard title={t("applicationsByStatus")}>
          <div className="statistics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="45%"
                  outerRadius="75%"
                  paddingAngle={2}
                  label
                >
                  {chartData.map(({ status }) => (
                    <Cell key={status} fill={STATUS_COLORS[status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("statusOverview")}>
          <div className="statistics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={70}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]}>
                  {chartData.map(({ status }) => (
                    <Cell key={status} fill={STATUS_COLORS[status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </main>
  );
}
