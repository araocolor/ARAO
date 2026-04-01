import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserReviewById, incrementUserReviewViewCount } from "@/lib/user-reviews";

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "0000.00.00";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default async function MainUserContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const item = await getUserReviewById(id);
  if (!item) {
    return (
      <main className="page">
        <section className="section stack">
          <h2>게시글을 찾을 수 없습니다</h2>
          <Link href="/user_review" className="user-review-back-link">목록보기</Link>
        </section>
      </main>
    );
  }

  await incrementUserReviewViewCount(id);

  return (
    <main className="page">
      <section className="section stack">
        <h2>{item.title}</h2>
        <p className="muted">
          {item.authorId} · {formatDate(item.createdAt)} · 조회 {item.viewCount + 1}
        </p>
        {item.thumbnailImage && (
          <img
            src={item.thumbnailImage}
            alt=""
            style={{ width: "100%", maxWidth: 420, aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 12 }}
          />
        )}
        <p style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>{item.content}</p>
        <p className="muted">좋아요/댓글/대댓글 기능은 다음 단계에서 연결됩니다.</p>
        <Link href="/user_review" className="user-review-back-link">목록보기</Link>
      </section>
    </main>
  );
}
