"use client";

import { useSearchParams } from "next/navigation";
import { GalleryCard } from "@/components/gallery-card";
import { GALLERY_CATEGORY_LABELS, GALLERY_CATEGORY_DEFAULTS } from "@/lib/gallery-categories";
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
