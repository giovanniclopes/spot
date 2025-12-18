import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CardInteractiveProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
  iconColor?: string;
  children?: ReactNode;
}

export function CardInteractive({
  icon: Icon,
  title,
  description,
  onClick,
  className,
  iconColor = "text-brand-primary",
  children,
}: CardInteractiveProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-card p-6 shadow-card transition-all duration-smooth hover:shadow-card-hover hover:bg-gradient-card-hover hover:-translate-y-1 cursor-pointer",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center bg-brand-accent/10 transition-transform duration-200 group-hover:scale-110",
            iconColor
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-heading-3">{title}</h3>
          <p className="text-caption text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-accent/10 to-transparent rounded-bl-full transform translate-x-16 -translate-y-16 transition-transform duration-300 group-hover:translate-x-12 group-hover:-translate-y-12" />
    </div>
  );
}

