import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
  fluid,
}: {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
}) {
  return (
    <div
      className={cn(
        `absolute inset-0 container overflow-y-scroll`,
        fluid && "px-0!",
        className,
      )}
    >
      {children}
    </div>
  );
}
