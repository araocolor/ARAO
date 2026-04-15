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
      label: "ARAO",
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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastTouchXRef = useRef<number | null>(null);
  const lastTouchTimeRef = useRef<number | null>(null);
  const velocityXRef = useRef(0);
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
  const goPrev = () => goTo(currentIndex - 1);
  const goNext = () => goTo(currentIndex + 1);

  const onTouchStart = (e: TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    lastTouchXRef.current = e.touches[0].clientX;
    lastTouchTimeRef.current = Date.now();
    velocityXRef.current = 0;
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragOffset(0);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartXRef.current;
    const dy = e.touches[0].clientY - touchStartYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }
    if (isDraggingRef.current) {
      e.preventDefault();
      const atStart = currentIndex === 0 && dx > 0;
      const atEnd = currentIndex === slides.length - 1 && dx < 0;
      const adjustedDx = atStart || atEnd ? dx * 0.35 : dx;
      setDragOffset(adjustedDx);

      const now = Date.now();
      if (lastTouchXRef.current !== null && lastTouchTimeRef.current !== null) {
        const dt = now - lastTouchTimeRef.current;
        if (dt > 0) {
          velocityXRef.current = (e.touches[0].clientX - lastTouchXRef.current) / dt;
        }
      }
      lastTouchXRef.current = e.touches[0].clientX;
      lastTouchTimeRef.current = now;
    }
  };

  const resetTouchMeta = () => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    lastTouchXRef.current = null;
    lastTouchTimeRef.current = null;
    isDraggingRef.current = false;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!isDraggingRef.current || touchStartXRef.current === null) {
      resetTouchMeta();
      return;
    }

    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const width = wrapRef.current?.clientWidth ?? 1;
    const distanceThreshold = width * 0.18;
    const velocityThreshold = 0.35;

    let nextIndex = currentIndex;
    if (Math.abs(dx) > distanceThreshold || Math.abs(velocityXRef.current) > velocityThreshold) {
      nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    }

    setIsDragging(false);
    setDragOffset(0);
    goTo(nextIndex);
    resetTouchMeta();
  };

  const currentSlide = slides[currentIndex];
  const trackTransform = `translate3d(calc(${-currentIndex * 100}% + ${dragOffset}px), 0, 0)`;

  return (
    <div
      ref={wrapRef}
      className="gallery-hero-image-wrap"
      style={aspectRatio ? { aspectRatio } : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="gallery-hero-slider-track"
        style={{
          transform: trackTransform,
          transition: isDragging ? "none" : "transform 360ms cubic-bezier(0.22, 0.61, 0.36, 1)",
        }}
      >
        {slides.map((slide, index) => (
          <div key={`${slide.src}-${index}`} className="gallery-hero-slide">
            <img
              className="gallery-hero-image"
              src={loadedSrcs[index] ?? slide.src}
              alt={label ?? ""}
              draggable={false}
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
      <span className="gallery-before-btn">{currentSlide.label ?? "ARAO"}</span>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="gallery-slide-arrow gallery-slide-arrow-left"
            onClick={goPrev}
            disabled={currentIndex === 0}
            aria-label="이전 사진"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="gallery-slide-arrow gallery-slide-arrow-right"
            onClick={goNext}
            disabled={currentIndex === slides.length - 1}
            aria-label="다음 사진"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
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
        </>
      )}
    </div>
  );
}
