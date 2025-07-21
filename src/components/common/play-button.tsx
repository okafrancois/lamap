"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconPlayerPlay } from "@tabler/icons-react";

interface PlayButtonProps {
  isVisible: boolean;
  onClick: () => void;
  className?: string;
}

export function PlayButton({ isVisible, onClick, className }: PlayButtonProps) {
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
        className="bg-primary hover:bg-primary/90 text-primary-foreground animate-in zoom-in-75 flex items-center gap-2 border-2 border-white/50 shadow-xl duration-200"
      >
        <IconPlayerPlay className="size-3" />
        Jouer
      </Button>
    </div>
  );
}
