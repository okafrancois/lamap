"use client";

import { LibButton } from "@/components/library/button";
import { cn } from "@/lib/utils";
import { IconPlayerPlay } from "@tabler/icons-react";

interface PlayButtonProps {
  isVisible: boolean;
  onClick: () => void;
  className?: string;
  isPlayable?: boolean;
}

export function PlayButton({
  isVisible,
  onClick,
  className,
  isPlayable = true,
}: PlayButtonProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <LibButton
        disabled={!isPlayable}
        className={`flex items-center rounded-full shadow-lg transition-transform ${
          isPlayable
            ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 active:scale-95"
            : "cursor-not-allowed bg-red-500/80 text-white"
        }`}
      >
        {isPlayable ? (
          <IconPlayerPlay className="size-icon" />
        ) : (
          <span className="text-xl">🚫</span>
        )}
      </LibButton>
    </div>
  );
}
