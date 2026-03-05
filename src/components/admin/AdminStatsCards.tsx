import { ClipboardList, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminStatsCardsProps {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export const AdminStatsCards = ({
  total,
  pending,
  inProgress,
  completed,
}: AdminStatsCardsProps) => {
  const stats = [
    {
      label: "Total Requests",
      value: total,
      icon: ClipboardList,
      bgClass: "bg-muted",
      iconClass: "text-foreground",
    },
    {
      label: "Pending",
      value: pending,
      icon: AlertTriangle,
      bgClass: "bg-[hsl(var(--status-pending))]/10",
      iconClass: "text-[hsl(var(--status-pending))]",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: Clock,
      bgClass: "bg-secondary/10",
      iconClass: "text-secondary",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      bgClass: "bg-primary/10",
      iconClass: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="shadow-card border-0 hover:shadow-elevated transition-shadow duration-200"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bgClass}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconClass}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
