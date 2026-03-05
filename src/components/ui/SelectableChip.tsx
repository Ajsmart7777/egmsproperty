import { cn } from "@/lib/utils";

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const SelectableChip = ({ label, selected, onClick, icon }: SelectableChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
        "border-2 active:scale-95",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-soft"
          : "border-border bg-card text-muted-foreground hover:border-brand-secondary hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
};

export default SelectableChip;
