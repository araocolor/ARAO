export const GALLERY_CATEGORIES = [
  "people", "outdoor", "indoor", "cafe",
  "summer", "fall", "winter", "spring",
  "food", "street", "life",
] as const;
export type GalleryCategory = typeof GALLERY_CATEGORIES[number];
