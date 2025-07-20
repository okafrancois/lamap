import { Button as ShadButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";

type ButtonProps = React.ComponentProps<typeof ShadButton> & {
  icon?: React.ReactNode;
  loading?: boolean;
  href?: string;
};

export function LibButton({
  children,
  icon,
  href,
  loading,
  className,
  ...props
}: ButtonProps) {
  if (href) {
    return (
      <ShadButton
        className={cn(className, "flex items-center gap-2")}
        asChild
        {...props}
      >
        <Link href={href} className="flex items-center gap-2">
          {loading && <Loader2 className="size-icon animate-spin" />}
          {!loading && icon}
          {children}
        </Link>
      </ShadButton>
    );
  }

  return (
    <ShadButton className={cn(className, "flex items-center gap-2")} {...props}>
      {loading && <Loader2 className="size-icon animate-spin" />}
      {!loading && icon}
      {children}
    </ShadButton>
  );
}
