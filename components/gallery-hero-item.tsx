"use client";

import { useRef, useState, useEffect, type TouchEvent } from "react";

type SlideImage = {
  src: string;
  srcFull?: string;
  label?: string;
  isArao?: boolean;
};

type GalleryHeroItemProps = {
  beforeImage: string;
  afterImage: string;
  beforeImageFull?: string;
  afterImageFull?: string;
  label?: string;
  aspectRatio?: string;
  beforeLabel?: string;
  extraImages?: { thumb: string; full: string; label?: string }[];
};

export function GalleryHeroItem({
  afterImage,
  afterImageFull,
  label,
  aspectRatio,
  extraImages,
}: GalleryHeroItemProps) {
  // 슬라이드: [ARAO] → [extra0] → [ARAO] → [extra1] → ...
  // extraImages가 없으면 ARAO 단독 1장
  const slides: SlideImage[] = (() => {
    const araoSlide: SlideImage = {
      src: afterImage,
      srcFull: afterImageFull,
      label: "[ARAO]아라오",
      isArao: true,
    };
    if (!extraImages || extraImages.length === 0) return [araoSlide];
    const result: SlideImage[] = [];
    for (const extra of extraImages) {
      result.push(araoSlide);
      result.push({ src: extra.thumb, srcFull: extra.full, label: extra.label });
    }
    return result;
  })();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedSrcs, setLoadedSrcs] = useState<string[]>(slides.map((s) => s.src));
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  // full 해상도 프리로드
  useEffect(() => {
    slides.forEach((slide, i) => {
      if (!slide.srcFull) return;
      const img = new Image();
      img.onload = () => {
        setLoadedSrcs((prev) => {
          const next = [...prev];
          next[i] = slide.srcFull!;
          return next;
        });
      };
      img.src = slide.srcFull;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afterImage, afterImageFull, JSON.stringify(extraImages)]);

  const goTo = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, slides.length - 1)));
  };

  const onTouchStart = (e: TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isDraggingRef.current = false;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartXRef.current;
    const dy = e.touches[0].clientY - touchStartYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      isDraggingRef.current = true;
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!isDraggingRef.current || touchStartXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    if (dx < -40 && currentIndex < slides.length - 1) goTo(currentIndex + 1);
    else if (dx > 40 && currentIndex > 0) goTo(currentIndex - 1);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isDraggingRef.current = false;
  };

  const currentSlide = slides[currentIndex];

  return (
    <div
      className="gallery-hero-image-wrap"
      style={aspectRatio ? { aspectRatio } : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <img
        className="gallery-hero-image"
        src={loadedSrcs[currentIndex] ?? currentSlide.src}
        alt={label ?? ""}
        draggable={false}
        loading="lazy"
      />
      <span className="gallery-before-btn">{currentSlide.label ?? "[ARAO]아라오"}</span>

      {slides.length > 1 && (
        <div className="gallery-slide-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`gallery-slide-dot${i === currentIndex ? " gallery-slide-dot-active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`슬라이드 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
