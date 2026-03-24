import { LandingPageFooter } from "@/components/landing-page-footer";
import { LandingPageHeader } from "@/components/landing-page-header";
import { getLandingContent } from "@/lib/landing-content";

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
            Before / After 비교를 한 화면에서 보면서 메시지 흐름과 시각적인 완성도를 확인할 수 있습니다.
          </p>
        </section>

        <section className="landing-stack-sm">
          <div className="landing-comparison">
            <article
              className="landing-comparison-item before landing-stack-sm"
              style={{ ["--landing-image" as string]: `url("${landingContent.comparison.beforeImage}")` }}
            >
              <div className="landing-comparison-label">{landingContent.comparison.beforeLabel}</div>
              <p className="landing-comparison-text">{landingContent.comparison.beforeText}</p>
            </article>
            <article
              className="landing-comparison-item after landing-stack-sm"
              style={{ ["--landing-image" as string]: `url("${landingContent.comparison.afterImage}")` }}
            >
              <div className="landing-comparison-label">{landingContent.comparison.afterLabel}</div>
              <p className="landing-comparison-text">{landingContent.comparison.afterText}</p>
            </article>
          </div>
        </section>

        <section className="landing-stack-sm">
          <span className="landing-section-label">Highlights</span>
          <div className="landing-gallery-grid">
            <article className="landing-feature-card landing-stack-xs">
              <strong>이미지 중심 비교</strong>
              <p className="muted">핵심 화면을 두 장면으로 나눠 전환 전과 후를 한 번에 보여줍니다.</p>
            </article>
            <article className="landing-feature-card landing-stack-xs">
              <strong>운영 연동형 편집</strong>
              <p className="muted">관리자 페이지에서 이미지를 교체하면 이 갤러리 페이지도 같은 데이터로 반영됩니다.</p>
            </article>
          </div>
        </section>

        <LandingPageFooter content={landingContent.footer} />
      </div>
    </main>
  );
}
