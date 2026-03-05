import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminStatusChartProps {
  pending: number;
  inProgress: number;
  completed: number;
}

export const AdminStatusChart = ({
  pending,
  inProgress,
  completed,
}: AdminStatusChartProps) => {
  const data = [
    { name: "Pending", value: pending, color: "hsl(45, 90%, 55%)" },
    { name: "In Progress", value: inProgress, color: "hsl(163, 54%, 34%)" },
    { name: "Completed", value: completed, color: "hsl(153, 82%, 24%)" },
  ].filter((item) => item.value > 0);

  if (data.length === 0) {
    return (
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Requests by Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">
          No data to display
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="text-lg">Requests by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
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
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
