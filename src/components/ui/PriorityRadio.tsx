import { cn } from "@/lib/utils";

interface PriorityRadioProps {
  value: string;
  label: string;
  selected: boolean;
  onChange: (value: string) => void;
  color: "low" | "medium" | "high";
  customColor?: string;
}

const PriorityRadio = ({ value, label, selected, onChange, color, customColor }: PriorityRadioProps) => {
  const colorClasses = {
    low: "border-brand-secondary bg-brand-secondary/10 text-brand-secondary",
    medium: "border-brand-accent bg-brand-accent/10 text-foreground",
    high: "border-destructive bg-destructive/10 text-destructive",
  };

  // Use custom color if provided
  const customStyle = customColor && selected ? {
    borderColor: customColor,
    backgroundColor: `${customColor}15`,
    color: customColor,
  } : undefined;

  const customRadioStyle = customColor && selected ? {
    borderColor: customColor,
    backgroundColor: customColor,
  } : undefined;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-200",
        "hover:shadow-soft active:scale-[0.98]",
        selected && !customColor
          ? colorClasses[color]
          : "border-border bg-card text-muted-foreground"
      )}
      style={customStyle}
    >
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
          selected && !customColor
            ? color === "low"
              ? "border-brand-secondary bg-brand-secondary"
              : color === "medium"
              ? "border-brand-accent bg-brand-accent"
              : "border-destructive bg-destructive"
            : "border-muted-foreground"
        )}
        style={customRadioStyle}
      >
        {selected && (
          <div className="h-2 w-2 rounded-full bg-card animate-scale-in" />
        )}
      </div>
      <input
        type="radio"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span className="font-medium">{label}</span>
    </label>
  );
};

export default PriorityRadio;
