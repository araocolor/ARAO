import { LandingPageFooter } from "@/components/landing-page-footer";
import { LandingPageHeader } from "@/components/landing-page-header";
import { getLandingContent } from "@/lib/landing-content";

export default async function ManualPage() {
  const landingContent = await getLandingContent();

  return (
    <main className="landing-page">
      <LandingPageHeader />

      <div className="landing-shell">
        <section className="landing-hero landing-stack-sm">
          <span className="landing-section-label">Manual</span>
          <h1 className="landing-hero-title">사용 방법과 운영 흐름을 한 곳에서 확인하세요.</h1>
          <p className="landing-hero-body">
            가입, 로그인, 관리자 접근, 콘텐츠 수정, 가격 관리까지 현재 랜딩 구조의 주요 흐름을 빠르게 볼
            수 있습니다.
          </p>
        </section>

        <section className="landing-stack-sm">
          <span className="landing-section-label">Workflow</span>
          <div className="landing-feature-grid">
            <article className="landing-feature-card landing-stack-xs">
              <strong>1. 회원 가입</strong>
              <p className="muted">랜딩 오른쪽 상단에서 일반 회원 가입 후 계정 페이지로 이동합니다.</p>
            </article>
            <article className="landing-feature-card landing-stack-xs">
              <strong>2. 관리자 권한</strong>
              <p className="muted">Supabase profiles 테이블의 role 값을 admin으로 두면 관리자 페이지에 진입합니다.</p>
            </article>
            <article className="landing-feature-card landing-stack-xs">
              <strong>3. 콘텐츠 수정</strong>
              <p className="muted">관리자 페이지에서 랜딩 문구와 비교 이미지, 가격 카드까지 수정할 수 있습니다.</p>
            </article>
          </div>
        </section>

        <section className="landing-stack-sm">
          <span className="landing-section-label">Current Assets</span>
          <div className="landing-gallery-grid">
            <article className="landing-feature-card landing-stack-xs">
              <strong>콘텐츠 관리</strong>
              <p className="muted">홈, 갤러리, 푸터, 리뷰, Before/After 이미지가 Supabase에 저장됩니다.</p>
            </article>
            <article className="landing-feature-card landing-stack-xs">
              <strong>가격 관리</strong>
              <p className="muted">Buy 페이지의 상단 소개와 요금 카드 항목을 관리자 화면에서 수정합니다.</p>
            </article>
          </div>
        </section>

        <LandingPageFooter content={landingContent.footer} />
      </div>
    </main>
  );
}
