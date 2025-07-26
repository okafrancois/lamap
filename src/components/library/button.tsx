import { Button as ShadButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSound } from "@/hooks/use-sound";

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
  const { playSound } = useSound();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Jouer le son de clic
    void playSound("click");

    // Appeler le onClick original s'il existe
    if (props.onClick) {
      props.onClick(e);
    }
  };

  const handleMouseEnter = () => {
    // Jouer le son de hover
    void playSound("hover", { volume: 0.3 });
  };
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
        <Link
          href={href}
          className="flex items-center gap-2"
          onClick={() => void playSound("click")}
          onMouseEnter={handleMouseEnter}
        >
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
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {loading && <Loader2 className="size-icon animate-spin" />}
      {!loading && icon}
      {children}
    </ShadButton>
  );
}
