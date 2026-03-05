import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface RequestStatsChartProps {
  pending: number;
  inProgress: number;
  completed: number;
}

const RequestStatsChart = ({ pending, inProgress, completed }: RequestStatsChartProps) => {
  const data = [
    { name: "Pending", value: pending, color: "hsl(var(--brand-primary))" },
    { name: "In Progress", value: inProgress, color: "hsl(var(--brand-secondary))" },
    { name: "Completed", value: completed, color: "hsl(var(--brand-accent))" },
  ];

  const total = pending + inProgress + completed;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No requests yet
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number, name: string) => [value, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RequestStatsChart;
