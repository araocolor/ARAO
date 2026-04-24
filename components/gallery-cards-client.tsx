"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GalleryCard } from "@/components/gallery-card";
import { getCached, setCached } from "@/hooks/use-prefetch-cache";
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS, GALLERY_CATEGORY_DEFAULTS } from "@/lib/gallery-categories";
import type { GalleryCategory } from "@/lib/gallery-categories";
import type { GalleryItem } from "@/lib/landing-content";

function formatGalleryExifCaption(item: { caption?: string; exif?: { camera?: string; lens?: string; iso?: string; aperture?: string; exposureMode?: string } }) {
  if (item.caption) return item.caption;
  const parts = [
    item.exif?.camera,
    item.exif?.lens,
    item.exif?.iso ? `ISO ${item.exif.iso}` : "",
    item.exif?.aperture,
    item.exif?.exposureMode,
  ].filter(Boolean);
  return parts.join(" / ");
}

type GalleryCardsClientProps = {
  items: Array<{ category: GalleryCategory; categoryIdx: number; item: GalleryItem }>;
};

export function GalleryCardsClient({ items }: GalleryCardsClientProps) {
  const searchParams = useSearchParams();
  const openCategory = searchParams.get("category") ?? undefined;
  const openIndex = searchParams.get("index") ?? undefined;
  const openCommentId = searchParams.get("commentId") ?? undefined;
  const likesSheet = searchParams.get("likesSheet") ?? undefined;
  const openTimestamp = searchParams.get("t") ?? undefined;

  useEffect(() => {
    let cancelled = false;
    let started = false;

    const targets = GALLERY_CATEGORIES
      .map((category, index) => ({ category, index }))
      .filter(({ index }) => index >= 4);

    if (targets.length === 0) return;

    async function prefetchRemainingComments() {
      if (cancelled || started) return;
      started = true;

      await Promise.allSettled(
        targets.map(async ({ category, index }) => {
          const cacheKey = `gallery_comments_${category}_${index}`;
          if (getCached(cacheKey)) return;

          const response = await fetch(`/api/gallery/${category}/${index}/comments`);
          if (!response.ok) return;
          const data = (await response.json()) as { comments?: unknown[] };
          setCached(cacheKey, { comments: Array.isArray(data.comments) ? data.comments : [] });
        })
      );
    }

    function handleScroll() {
      window.removeEventListener("scroll", handleScroll);
      void prefetchRemainingComments();
    }

    if (window.scrollY > 0) {
      void prefetchRemainingComments();
      return () => {
        cancelled = true;
      };
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", handleScroll);
    };
  }, [items]);

  return (
    <>
      {items.map(({ category, categoryIdx, item }) => {
        const beforeSrc = item.beforeImage || item.beforeImageFull || "";
        const afterSrc = item.afterImage || item.afterImageFull || "";
        if (!beforeSrc || !afterSrc) return null;
        const title = item.title || GALLERY_CATEGORY_LABELS[category];
        const body = item.body || GALLERY_CATEGORY_DEFAULTS[category];
        const caption = formatGalleryExifCaption(item);
        return (
          <GalleryCard
            key={category}
            category={category}
            index={categoryIdx}
            title={title}
            body={body}
            beforeImage={beforeSrc}
            afterImage={afterSrc}
            beforeImageFull={item.beforeImageFull || undefined}
            afterImageFull={item.afterImageFull || undefined}
            beforeLabel={item.beforeLabel || undefined}
            extraImages={item.extraImages?.length ? item.extraImages : undefined}
            caption={caption || undefined}
            aspectRatio={item.aspectRatio}
            autoOpenComments={
              likesSheet !== "1" &&
              Boolean(openCommentId) &&
              category === openCategory &&
              String(categoryIdx) === openIndex
            }
            autoOpenLikes={likesSheet === "1" && category === openCategory && String(categoryIdx) === openIndex}
            highlightCommentId={category === openCategory && String(categoryIdx) === openIndex ? openCommentId : undefined}
            openTimestamp={category === openCategory && String(categoryIdx) === openIndex ? openTimestamp : undefined}
          />
        );
      })}
    </>
  );
}
