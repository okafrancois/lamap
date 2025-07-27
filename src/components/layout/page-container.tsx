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
  if (fluid) {
    return (
      <div className={cn(`absolute inset-0 overflow-y-scroll`, className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(`absolute inset-0 container overflow-y-scroll`, className)}
    >
      {children}
    </div>
  );
}
