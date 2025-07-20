export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col gap-4 py-4 md:gap-6 md:py-6">
      {children}
    </div>
  );
}
