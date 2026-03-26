"use client";

import { useRef, useState } from "react";

type GalleryHeroItemProps = {
  beforeImage: string;
  afterImage: string;
  label?: string;
};

export function GalleryHeroItem({ beforeImage, afterImage, label }: GalleryHeroItemProps) {
  const [showBefore, setShowBefore] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handlePressStart() {
    setShowBefore(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowBefore(false);
      timerRef.current = null;
    }, 3000);
  }

  function handlePressEnd() {
    setShowBefore(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <div
      className="gallery-hero-image-wrap"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <img
        className="gallery-hero-image"
        src={afterImage}
        alt={label ?? ""}
        draggable={false}
        loading="lazy"
        style={{ opacity: showBefore ? 0 : 1 }}
      />
      <img
        className="gallery-hero-image gallery-hero-image-before"
        src={beforeImage}
        alt=""
        draggable={false}
        loading="lazy"
        style={{ opacity: showBefore ? 1 : 0 }}
      />
      <span className="gallery-before-btn">{showBefore ? "Before" : "Arao"}</span>
    </div>
  );
}
