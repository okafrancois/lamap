import { cn } from "@/lib/utils";

type LibTitleProps = React.ComponentProps<"h1"> & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

const styles = {
  h1: "text-4xl font-medium",
  h2: "text-3xl font-medium",
  h3: "text-2xl font-medium",
  h4: "text-xl font-medium",
  h5: "text-lg font-medium",
  h6: "text-base font-medium",
};

export function LibTitle({
  children,
  className,
  as = "h1",
  ...props
}: LibTitleProps) {
  const Tag = as;
  return (
    <Tag className={cn(styles[as], className)} {...props}>
      {children}
    </Tag>
  );
}
