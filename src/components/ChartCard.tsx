import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  children: ReactNode;
};

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <section className="chart-card">
      <h2 className="chart-card__title">{title}</h2>
      <div className="chart-card__content">{children}</div>
    </section>
  );
}
