import {
  DecorativeCornerIcon,
  FloatingParticle,
  DecorativeBorder,
} from "./decorative-icons";

export function BackgroundDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Motifs de bordure élégants */}
      <DecorativeCornerIcon className="absolute top-0 left-0" />
      <DecorativeCornerIcon className="absolute top-0 right-0 rotate-90" />
      <DecorativeCornerIcon className="absolute bottom-0 left-0 -rotate-90" />
      <DecorativeCornerIcon className="absolute right-0 bottom-0 rotate-180" />

      {/* Particules flottantes */}
      <FloatingParticle
        className="absolute top-1/4 left-1/4 bg-amber-400/40"
        delay="0s"
      />
      <FloatingParticle
        className="absolute top-1/3 right-1/4 bg-amber-300/30"
        size="h-1 w-1"
        delay="1s"
      />
      <FloatingParticle
        className="absolute bottom-1/4 left-1/3 bg-amber-500/50"
        size="h-1.5 w-1.5"
        delay="2s"
      />
      <FloatingParticle
        className="absolute right-1/3 bottom-1/3 bg-amber-200/40"
        size="h-1 w-1"
        delay="0.5s"
      />

      {/* Bordures latérales décoratives */}
      <DecorativeBorder className="absolute top-1/2 left-2 -translate-y-1/2" />
      <DecorativeBorder className="absolute top-1/2 right-2 -translate-y-1/2" />
      <DecorativeBorder
        className="absolute top-2 left-1/2 -translate-x-1/2"
        orientation="horizontal"
      />
      <DecorativeBorder
        className="absolute bottom-2 left-1/2 -translate-x-1/2"
        orientation="horizontal"
      />
    </div>
  );
}
