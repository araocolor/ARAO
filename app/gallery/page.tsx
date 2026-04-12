import { Suspense } from "react";
import { LandingPageFooter } from "@/components/landing-page-footer";
import { LandingPageHeader } from "@/components/landing-page-header";
import { GalleryCardsClient } from "@/components/gallery-cards-client";
import { getLandingContent } from "@/lib/landing-content";
import { GALLERY_CATEGORIES } from "@/lib/gallery-categories";

export default async function GalleryPage() {
  const landingContent = await getLandingContent();

  const items = GALLERY_CATEGORIES.flatMap((category, categoryIdx) => {
    const item = landingContent.gallery[category];
    if (!item) return [];
    return [{ category, categoryIdx, item }];
  });

  return (
    <main className="landing-page">
      <LandingPageHeader />

      <div className="landing-shell">
        <section className="landing-hero landing-stack-sm">
          <span className="landing-section-label">Gallery</span>
          <h1 className="landing-hero-title">{landingContent.comparison.sectionTitle}</h1>
          <p className="landing-hero-body">
            버튼을 누르고 있는 동안 Before 사진을 확인할 수 있습니다.
          </p>
        </section>

        <Suspense>
          <GalleryCardsClient items={items} />
        </Suspense>

        <LandingPageFooter content={landingContent.footer} />
      </div>
    </main>
  );
}
