import { LandingPageFooter } from "@/components/landing-page-footer";
import { LandingPageHeader } from "@/components/landing-page-header";
import { GalleryHeroItem } from "@/components/gallery-hero-item";
import { getLandingContent } from "@/lib/landing-content";

const GALLERY_SECTIONS = [
  { category: "people" as const, label: "인물" },
  { category: "outdoor" as const, label: "환경야외" },
  { category: "indoor" as const, label: "실내카페" },
];

export default async function GalleryPage() {
  const landingContent = await getLandingContent();

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

        {GALLERY_SECTIONS.map(({ category, label }) => {
          const item = landingContent.gallery[category];
          if (!item) return null;
          return (
            <section key={category} className="landing-stack-sm">
              <h2 className="gallery-section-title">{label}</h2>
              <GalleryHeroItem
                beforeImage={item.beforeImageFull}
                afterImage={item.afterImageFull}
                label={label}
              />
            </section>
          );
        })}

        <LandingPageFooter content={landingContent.footer} />
      </div>
    </main>
  );
}
