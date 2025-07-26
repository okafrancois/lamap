"use client";

import { useState, useEffect } from "react";
import {
  IconVolumeOff,
  IconVolume,
  IconVolume2,
  IconVolume3,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";
import { LibButton } from "@/components/library/button";

interface SoundControlsProps {
  className?: string;
}

export function SoundControls({ className = "" }: SoundControlsProps) {
  const [volume, setVolume] = useState(70);
  const [isEnabled, setIsEnabled] = useState(true);

  // Persister les paramètres dans localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem("kora-sound-volume");
    const savedEnabled = localStorage.getItem("kora-sound-enabled");

    if (savedVolume) setVolume(parseInt(savedVolume));
    if (savedEnabled) setIsEnabled(savedEnabled === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("kora-sound-volume", volume.toString());
    localStorage.setItem("kora-sound-enabled", isEnabled.toString());
  }, [volume, isEnabled]);

  const getVolumeIcon = () => {
    if (!isEnabled || volume === 0) return IconVolumeOff;
    if (volume < 30) return IconVolume;
    if (volume < 70) return IconVolume2;
    return IconVolume3;
  };

  const toggleEnabled = () => {
    setIsEnabled(!isEnabled);
  };

  const increaseVolume = () => {
    const newVolume = Math.min(100, volume + 10);
    setVolume(newVolume);
    if (newVolume > 0 && !isEnabled) setIsEnabled(true);
  };

  const decreaseVolume = () => {
    const newVolume = Math.max(0, volume - 10);
    setVolume(newVolume);
    if (newVolume === 0) setIsEnabled(false);
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <LibButton
        variant="ghost"
        size="sm"
        onClick={toggleEnabled}
        className={`${isEnabled ? "text-foreground" : "text-muted-foreground"}`}
        title="Activer/Désactiver les sons"
      >
        <VolumeIcon className="size-4" />
      </LibButton>

      {isEnabled && (
        <>
          <LibButton
            variant="ghost"
            size="sm"
            onClick={decreaseVolume}
            disabled={volume === 0}
            className="text-muted-foreground hover:text-foreground"
            title="Diminuer le volume"
          >
            <IconChevronDown className="size-3" />
          </LibButton>

          <span className="text-muted-foreground min-w-[2rem] text-center text-xs">
            {volume}%
          </span>

          <LibButton
            variant="ghost"
            size="sm"
            onClick={increaseVolume}
            disabled={volume === 100}
            className="text-muted-foreground hover:text-foreground"
            title="Augmenter le volume"
          >
            <IconChevronUp className="size-3" />
          </LibButton>
        </>
      )}
    </div>
  );
}

// Hook pour utiliser les paramètres audio depuis d'autres composants
export function useSoundSettings() {
  const [volume, setVolume] = useState(70);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const savedVolume = localStorage.getItem("kora-sound-volume");
    const savedEnabled = localStorage.getItem("kora-sound-enabled");

    if (savedVolume) setVolume(parseInt(savedVolume));
    if (savedEnabled) setIsEnabled(savedEnabled === "true");
  }, []);

  return {
    volume: volume / 100, // Normaliser pour useSound
    enabled: isEnabled,
  };
}
