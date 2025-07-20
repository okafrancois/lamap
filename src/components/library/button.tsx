import { Button as ShadButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";

type ButtonProps = React.ComponentProps<typeof ShadButton> & {
  icon?: React.ReactNode;
  loading?: boolean;
  href?: string;
  position?: "left" | "right" | "center";
};

export function LibButton({
  children,
  icon,
  href,
  loading,
  className,
  position = "center",
  ...props
}: ButtonProps) {
  if (href) {
    return (
      <ShadButton
        className={cn(
          className,
          "items-center gap-2",
          position === "left" && "justify-start",
          position === "right" && "justify-end",
          position === "center" && "justify-center",
        )}
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
    <ShadButton
      className={cn(
        className,
        "items-center gap-2",
        position === "left" && "justify-start",
        position === "right" && "justify-end",
        position === "center" && "justify-center",
      )}
      {...props}
    >
      {loading && <Loader2 className="size-icon animate-spin" />}
      {!loading && icon}
      {children}
    </ShadButton>
  );
}
