import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: string;
  trendDirection?: "up" | "down";
  color?: "blue" | "green" | "purple" | "orange";
}

const colorMap = {
  blue: "from-blue-600/10 to-blue-700/10 text-blue-700",
  green: "from-green-500/10 to-green-600/10 text-green-600",
  purple: "from-purple-500/10 to-purple-600/10 text-purple-600",
  orange: "from-orange-500/10 to-orange-600/10 text-orange-600",
};

export function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  trendDirection,
  color = "blue",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-gradient-card p-6 shadow-card transition-all duration-smooth hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br",
            colorMap[color]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trendDirection === "up"
                ? "text-success"
                : trendDirection === "down"
                ? "text-error"
                : "text-muted-foreground"
            )}
          >
            {trendDirection === "up" && <TrendingUp className="h-4 w-4" />}
            {trendDirection === "down" && <TrendingDown className="h-4 w-4" />}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-display-2 font-semibold">{value}</p>
        <p className="text-caption text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

