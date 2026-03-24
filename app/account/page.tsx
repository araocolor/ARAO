import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncProfile } from "@/lib/profiles";

export default async function AccountPage() {
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

  return (
    <main className="page stack">
      <section className="section stack">
        <p className="muted">Account</p>
        <h1>회원 계정 페이지</h1>
        <p className="muted">Clerk 사용자 정보와 Supabase profile 확장 필드를 함께 사용합니다.</p>
        <p className="muted">Clerk 이메일: {email ?? "없음"}</p>
        {profileError ? (
          <>
            <p className="muted">message: {profileError.message ?? "없음"}</p>
            <p className="muted">hint: {profileError.hint ?? "없음"}</p>
          </>
        ) : null}
        <p className="muted">이메일: {profile?.email ?? "없음"}</p>
        <p className="muted">역할: {profile?.role ?? "없음"}</p>
        <p className="muted">이름: {profile?.full_name ?? "없음"}</p>
      </section>
    </main>
  );
}
