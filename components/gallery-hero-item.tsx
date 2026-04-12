"use client";

import { useRef, useState, useEffect } from "react";

type GalleryHeroItemProps = {
  beforeImage: string;
  afterImage: string;
  beforeImageFull?: string;
  afterImageFull?: string;
  label?: string;
  aspectRatio?: string;
};

export function GalleryHeroItem({ beforeImage, afterImage, beforeImageFull, afterImageFull, label, aspectRatio }: GalleryHeroItemProps) {
  const [showBefore, setShowBefore] = useState(false);
  const [beforeSrc, setBeforeSrc] = useState(beforeImage);
  const [afterSrc, setAfterSrc] = useState(afterImage);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!beforeImageFull && !afterImageFull) return;

    if (beforeImageFull) {
      const img = new Image();
      img.onload = () => setBeforeSrc(beforeImageFull);
      img.src = beforeImageFull;
    }
    if (afterImageFull) {
      const img = new Image();
      img.onload = () => setAfterSrc(afterImageFull);
      img.src = afterImageFull;
    }
  }, [beforeImageFull, afterImageFull]);

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
      style={aspectRatio ? { aspectRatio } : undefined}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <img
        className="gallery-hero-image"
        src={afterSrc}
        alt={label ?? ""}
        draggable={false}
        loading="lazy"
        style={{ opacity: showBefore ? 0 : 1 }}
      />
      <img
        className="gallery-hero-image gallery-hero-image-before"
        src={beforeSrc}
        alt=""
        draggable={false}
        loading="lazy"
        style={{ opacity: showBefore ? 1 : 0 }}
      />
      <span className="gallery-before-btn">{showBefore ? "Before" : "Arao"}</span>
    </div>
  );
}
