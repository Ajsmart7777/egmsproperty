import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

const MobileHeader = ({ title, showBack = true, onBack }: MobileHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // On desktop, show a simpler header without the back button
  if (!isMobile) {
    return (
      <header className="px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 bg-card px-4 py-4 shadow-soft">
      <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-brand-light active:scale-95 shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
    </header>
  );
};

export default MobileHeader;
