import { LandingPageFooter } from "@/components/landing-page-footer";
import { LandingPageHeader } from "@/components/landing-page-header";
import { getLandingContent } from "@/lib/landing-content";

export default async function AraoPage() {
  const landingContent = await getLandingContent();

  return (
    <main className="landing-page">
      <LandingPageHeader />

      <div className="landing-shell">
        <section className="landing-hero landing-stack-sm">
          <span className="landing-section-label">Arao</span>
          <h1 className="landing-hero-title">{landingContent.hero.title}</h1>
          <p className="landing-hero-body">{landingContent.hero.body}</p>
        </section>

        <section className="landing-stack-sm">
          <span className="landing-section-label">About</span>
          <div className="landing-feature-grid">
            <article className="landing-feature-card landing-stack-xs">
              <strong>모바일 우선 구조</strong>
              <p className="muted">작은 화면에서 먼저 완성도를 맞추고, 태블릿 폭까지 자연스럽게 확장합니다.</p>
            </article>
            <article className="landing-feature-card landing-stack-xs">
              <strong>운영 연동 준비</strong>
              <p className="muted">Clerk, Supabase, 관리자 화면, 콘텐츠 관리까지 서비스형 구조로 이어집니다.</p>
            </article>
            <article className="landing-feature-card landing-stack-xs">
              <strong>브랜드 경험 유지</strong>
              <p className="muted">랜딩, 갤러리, 가격 페이지가 모두 같은 헤더와 톤을 공유합니다.</p>
            </article>
          </div>
        </section>

        <section className="landing-stack-sm">
          <span className="landing-section-label">{landingContent.reviews.sectionTitle}</span>
          <div className="landing-reviews">
            {landingContent.reviews.items.map((item) => (
              <article
                key={`${item.name}-${item.detail}`}
                className={
                  item.variant === "glass"
                    ? "landing-card landing-card-glass landing-stack-xs"
                    : "landing-card landing-card-review landing-stack-xs"
                }
              >
                <p className="landing-review-quote">{item.quote}</p>
                <div className="landing-review-rating">{item.rating}</div>
                <div className="landing-stack-xs">
                  <p className="landing-review-name">{item.name}</p>
                  <p className="landing-review-detail">{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <LandingPageFooter content={landingContent.footer} />
      </div>
    </main>
  );
}
