interface DecorativeIconProps {
  className?: string;
  opacity?: number;
}

export function DecorativeCornerIcon({
  className = "",
  opacity = 0.2,
}: DecorativeIconProps) {
  return (
    <div className={`h-32 w-32 ${className}`} style={{ opacity }}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <path
          d="M20,20 Q50,5 80,20 Q95,50 80,80 Q50,95 20,80 Q5,50 20,20 Z"
          fill="none"
          stroke="rgba(251, 191, 36, 0.6)"
          strokeWidth="1"
        />
        <circle cx="50" cy="50" r="8" fill="rgba(251, 191, 36, 0.3)" />
      </svg>
    </div>
  );
}

export function FloatingParticle({
  className = "",
  delay = "0s",
  size = "h-2 w-2",
}: DecorativeIconProps & { delay?: string; size?: string }) {
  return (
    <div
      className={`${size} animate-pulse rounded-full bg-amber-400/40 ${className}`}
      style={{ animationDelay: delay }}
    />
  );
}

export function DecorativeBorder({
  className = "",
  orientation = "vertical",
}: DecorativeIconProps & { orientation?: "vertical" | "horizontal" }) {
  const baseClasses =
    orientation === "vertical"
      ? "h-24 w-1 bg-gradient-to-b"
      : "h-1 w-24 bg-gradient-to-r";

  return (
    <div
      className={`${baseClasses} from-transparent via-amber-400/30 to-transparent ${className}`}
    />
  );
}

export function CircularDecoration({
  className = "",
  size = "h-8 w-8",
  innerSize = "h-6 w-6",
}: DecorativeIconProps & { size?: string; innerSize?: string }) {
  return (
    <div className={`${size} ${className}`}>
      <div className="h-full w-full rounded-full border-2 border-amber-400/40 bg-amber-200/10">
        <div className={`m-1 ${innerSize} rounded-full bg-amber-300/30`} />
      </div>
    </div>
  );
}

export function GameTablePattern() {
  return (
    <div className="absolute inset-0 rounded-2xl">
      <svg className="h-full w-full" viewBox="0 0 200 200">
        <line
          x1="100"
          y1="40"
          x2="100"
          y2="160"
          stroke="rgba(251, 191, 36, 0.2)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        <line
          x1="40"
          y1="100"
          x2="160"
          y2="100"
          stroke="rgba(251, 191, 36, 0.2)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        <circle
          cx="100"
          cy="100"
          r="25"
          fill="none"
          stroke="rgba(251, 191, 36, 0.3)"
          strokeWidth="2"
          strokeDasharray="3,3"
        />
        <path
          d="M70,70 L100,50 L130,70 L100,90 Z"
          fill="none"
          stroke="rgba(251, 191, 36, 0.15)"
          strokeWidth="1"
        />
        <path
          d="M70,130 L100,110 L130,130 L100,150 Z"
          fill="none"
          stroke="rgba(251, 191, 36, 0.15)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

export function AnimatedRing({
  className = "",
  size = "h-[45%] w-[45%]",
  duration = "4s",
  delay = "0s",
}: DecorativeIconProps & {
  size?: string;
  duration?: string;
  delay?: string;
}) {
  return (
    <div
      className={`absolute ${size} animate-pulse rounded-full border border-amber-400/20 ${className}`}
      style={{ animationDuration: duration, animationDelay: delay }}
    />
  );
}
