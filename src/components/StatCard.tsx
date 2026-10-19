type StatCardProps = {
  title: string;
  value: number;
  icon: string;
  color: string;
};

export default function StatCard({
  title,
  value,
  icon,
  color,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div
        className="stat-icon"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>

      <div className="stat-info">
        <h4>{title}</h4>

        <h2>{value}</h2>
      </div>
    </div>
  );
}