import { cn } from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import { Droplets, Zap, Sparkles, Building2, MoreHorizontal, Calendar } from "lucide-react";

type Status = "pending" | "in-progress" | "completed";
type IssueType = "plumbing" | "electrical" | "cleaning" | "structural" | "others";

interface RequestCardProps {
  title: string;
  description: string;
  issueType: IssueType;
  dateSubmitted: string;
  status: Status;
  onClick?: () => void;
}

const issueIcons = {
  plumbing: Droplets,
  electrical: Zap,
  cleaning: Sparkles,
  structural: Building2,
  others: MoreHorizontal,
};

const issueColors = {
  plumbing: "bg-blue-100 text-blue-600",
  electrical: "bg-amber-100 text-amber-600",
  cleaning: "bg-brand-accent/20 text-brand-accent",
  structural: "bg-brand-light text-brand-primary",
  others: "bg-muted text-muted-foreground",
};

const RequestCard = ({
  title,
  description,
  issueType,
  dateSubmitted,
  status,
  onClick,
}: RequestCardProps) => {
  const Icon = issueIcons[issueType];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl bg-card p-4 text-left shadow-card transition-all duration-200",
        "hover:shadow-elevated hover:-translate-y-0.5 active:scale-[0.98]",
        "animate-fade-in"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            issueColors[issueType]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {dateSubmitted}
            </div>
            <StatusBadge status={status} />
          </div>
        </div>
      </div>
    </button>
  );
};

export default RequestCard;
