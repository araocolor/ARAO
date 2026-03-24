import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getLandingContent } from "@/lib/landing-content";
import { syncProfile } from "@/lib/profiles";

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  let profile = null;
  let profileError: { message?: string; hint?: string } | null = null;

  try {
    profile = await syncProfile({ email, fullName });
  } catch (error) {
    if (error instanceof Error) {
      profileError = { message: error.message };
    } else if (typeof error === "object" && error !== null) {
      profileError = error as { message?: string; hint?: string };
    } else {
      profileError = { message: "Unknown profile sync error" };
    }
  }

  if (profileError) {
    return (
      <main className="page stack">
        <section className="section stack">
          <p className="muted">Admin</p>
          <h1>프로필 연결 오류</h1>
          <p className="muted">이 계정의 Supabase profile을 읽는 중 문제가 발생했습니다.</p>
          <p className="muted">message: {profileError.message ?? "없음"}</p>
          <p className="muted">hint: {profileError.hint ?? "없음"}</p>
          <p className="muted">로그인 이메일: {email ?? "없음"}</p>
        </section>
      </main>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <main className="page stack">
        <section className="section stack">
          <p className="muted">Admin</p>
          <h1>관리자 권한이 필요합니다</h1>
          <p className="muted">
            현재 로그인한 계정은 관리자 권한이 없습니다. 현재 역할: {profile?.role ?? "unknown"}
          </p>
          <p className="muted">
            Supabase의 <code>profiles</code> 테이블에서 이 계정의 <code>role</code> 값을{" "}
            <code>admin</code>으로 바꾸면 접근할 수 있습니다.
          </p>
          <Link href="/account">계정 페이지로 이동</Link>
        </section>
      </main>
    );
  }

  const landingContent = await getLandingContent();

  return (
    <main className="admin-page">
      <AdminDashboard email={profile.email} role={profile.role} landingContent={landingContent} />
    </main>
  );
}
