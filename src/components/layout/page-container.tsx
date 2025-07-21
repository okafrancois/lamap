import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-4 py-4 md:gap-6 md:py-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
