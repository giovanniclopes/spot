import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-accent/20 to-brand-primary/10 flex items-center justify-center mb-6">
        <Icon className="h-8 w-8 text-brand-primary" />
      </div>
      <h3 className="text-heading-2 font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-caption text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

