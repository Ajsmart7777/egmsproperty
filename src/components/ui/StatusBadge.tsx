import { cn } from "@/lib/utils";
import { Clock, Loader2, CheckCircle2 } from "lucide-react";

type Status = "pending" | "in-progress" | "completed";

interface StatusBadgeProps {
  status: Status;
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-status-pending/15 text-status-pending border-status-pending/30",
  },
  "in-progress": {
    label: "In Progress",
    icon: Loader2,
    className: "bg-status-in-progress/15 text-status-in-progress border-status-in-progress/30",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-status-completed/15 text-status-completed border-status-completed/30",
  },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        config.className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "in-progress" && "animate-spin")} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
