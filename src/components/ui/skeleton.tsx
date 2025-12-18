import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-gray-200 to-gray-100",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
