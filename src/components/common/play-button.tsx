"use client";

import { Button } from "@/components/ui/button";
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
      <Button
        size="sm"
        disabled={!isPlayable}
        className={`flex items-center gap-2 shadow-lg transition-transform ${
          isPlayable
            ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 active:scale-95"
            : "cursor-not-allowed bg-red-500/80 text-white"
        }`}
      >
        {isPlayable ? (
          <>
            <IconPlayerPlay className="size-3" />
            Jouer
          </>
        ) : (
          <>
            <span className="text-xl">🚫</span>
            Non jouable
          </>
        )}
      </Button>
    </div>
  );
}
