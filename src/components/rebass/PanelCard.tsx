import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PanelCardProps {
  title: string;
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}

export const PanelCard = ({
  title,
  icon: Icon,
  className,
  children,
}: PanelCardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm p-5 shadow-lg",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="h-4 w-4 text-neon" />}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
};