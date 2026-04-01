import Link from "next/link";

export default function MainWriteReviewPage() {
  return (
    <main className="page">
      <section className="section stack">
        <h2>write_review</h2>
        <p className="muted">작성 화면은 다음 단계에서 연결됩니다.</p>
        <Link href="/user_review" className="user-review-back-link">
          목록보기
        </Link>
      </section>
    </main>
  );
}

