import Image from "next/image";
import { notFound } from "next/navigation";
import { LandingPageFooter } from "@/components/landing-page-footer";
import { ColorOrderHeader } from "@/components/order-header";
import { GalleryDetailOrderFooter } from "@/components/gallery-detail-order-footer";
import { getColorIdByProductCode } from "@/lib/colors";
import { getLandingContent } from "@/lib/landing-content";
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS, type GalleryCategory } from "@/lib/gallery-categories";

const GALLERY_ORDER_PRODUCT_CODE = "arao";

function isGalleryCategory(value: string): value is GalleryCategory {
  return (GALLERY_CATEGORIES as readonly string[]).includes(value);
}

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isGalleryCategory(category)) notFound();

  const landingContent = await getLandingContent();
  const item = landingContent.gallery[category];
  if (!item) notFound();

  const imageSrc = item.afterImage || item.afterImageFull || "";
  if (!imageSrc) notFound();

  const label = GALLERY_CATEGORY_LABELS[category];
  const title = item.title || label;
  const linkedColorId = await getColorIdByProductCode(GALLERY_ORDER_PRODUCT_CODE);
  const orderHref = linkedColorId ? `/color/${linkedColorId}/order` : null;

  return (
    <main
      className="landing-page gallery-page"
      style={{ WebkitTextSizeAdjust: "100%", textSizeAdjust: "100%" }}
    >
      <ColorOrderHeader />

      <div className="gallery-detail-shell">
        <section className="gallery-content-width-760">
          <div className="gallery-detail-image-wrap">
            <Image
              src={imageSrc}
              alt={title}
              fill
              sizes="100vw"
              className="gallery-detail-image"
              priority
            />
          </div>

          <div className="gallery-detail-body">
            <h1 className="gallery-detail-title">{title}</h1>

            <div className="gallery-detail-meta">
              <span>프로파일 : ARAO</span>
              <span className="gallery-detail-meta-sep">/</span>
              <span>카테고리 : {label}</span>
            </div>
          </div>
        </section>

        <LandingPageFooter content={landingContent.footer} />
      </div>
      <GalleryDetailOrderFooter orderHref={orderHref} />
    </main>
  );
}
