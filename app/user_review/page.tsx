import { LandingPageHeader } from "@/components/landing-page-header";
import { MainUserReviewPage } from "@/components/main-user-review-page";
import { Suspense } from "react";

export default async function MainUserReviewListPage() {
  return (
    <main className="landing-page">
      <LandingPageHeader />

      <div className="landing-shell">
        <section className="landing-stack-sm">
          <Suspense fallback={<div className="user-review-page" />}>
            <MainUserReviewPage />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
