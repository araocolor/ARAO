import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <main className="page stack">
      <SiteHeader
        links={[
          { href: "/admin", label: "관리" },
          { href: "/orders", label: "주문" },
          { href: "/sales", label: "매출" },
          { href: "/account", label: "계정" },
        ]}
      />

      <section className="section stack">
        <p className="muted">Global-ready stack</p>
        <h1>Next.js + Supabase + Clerk + PortOne + Stripe</h1>
        <p className="muted">
          이 페이지는 현재 정적 랜딩을 확장형 서비스 구조로 옮길 때 사용할 백업 스캐폴드입니다.
        </p>
        <Link href="/admin">관리자 예시 페이지로 이동</Link>
      </section>
    </main>
  );
}
