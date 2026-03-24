"use client";

import Link from "next/link";
import { useState } from "react";
import type { LandingContent } from "@/lib/landing-content";
import { AdminContentManager } from "@/components/admin-content-manager";
import { AdminPricingManager } from "@/components/admin-pricing-manager";
import { AdminSignOut } from "@/components/admin-sign-out";

const adminSections = [
  {
    id: "content",
    menu: "콘텐츠 관리",
    eyebrow: "Content",
    title: "콘텐츠 관리",
    description: "랜딩 페이지의 제목, 설명, 리뷰, 푸터, Before / After 이미지를 Supabase와 연결해서 수정합니다.",
  },
  {
    id: "pricing",
    menu: "상품가격",
    eyebrow: "Pricing",
    title: "상품가격 관리",
    description: "pricing 페이지의 상단 소개와 각 요금 카드 내용을 Supabase와 연결해서 수정합니다.",
  },
  {
    id: "members",
    menu: "회원 관리",
    eyebrow: "Members",
    title: "회원 관리",
    description: "Clerk 계정과 Supabase profiles 테이블을 기준으로 관리자, 일반 사용자, 운영 담당자 역할을 구분합니다.",
    items: ["Clerk 사용자 조회", "profiles role 관리", "관리자 계정 승인 흐름"],
  },
  {
    id: "orders",
    menu: "주문 관리",
    eyebrow: "Orders",
    title: "주문 관리",
    description: "orders, order_items, payments 구조를 기준으로 주문 생성부터 결제 완료 이후 상태 변경까지 확인합니다.",
    items: ["주문 목록", "주문 상태 추적", "결제 실패/취소 처리"],
  },
  {
    id: "sales",
    menu: "매출 관리",
    eyebrow: "Sales",
    title: "매출 관리",
    description: "결제 완료 기준으로 매출을 집계하고 환불과 취소는 별도로 분리해서 관리할 수 있도록 확장합니다.",
    items: ["매출 집계", "환불 분리", "기간별 리포트"],
  },
  {
    id: "auth",
    menu: "인증 관리",
    eyebrow: "Auth",
    title: "인증 관리",
    description: "로그인, 관리자 접근 제어, 역할 기반 권한 흐름을 이 영역에서 계속 확장할 수 있습니다.",
    items: ["로그인 정책", "관리자 접근 제한", "역할 기반 권한 체크"],
  },
];

type AdminDashboardProps = {
  email: string;
  role: string;
  landingContent: LandingContent;
};

export function AdminDashboard({ email, role, landingContent }: AdminDashboardProps) {
  const [activeSectionId, setActiveSectionId] = useState(adminSections[0].id);
  const activeSection =
    adminSections.find((section) => section.id === activeSectionId) ?? adminSections[0];

  return (
    <div className="admin-layout admin-layout-root">
      <aside className="admin-sidebar admin-sidebar-root">
        <p className="admin-sidebar-title">관리 메뉴</p>
        <div className="admin-sidebar-top">
          <Link className="admin-menu-link" href="/">
            홈이동
          </Link>
        </div>
        <div className="admin-menu-list">
          {adminSections.map((section) => (
            <button
              key={section.id}
              className={section.id === activeSectionId ? "admin-menu-item active" : "admin-menu-item"}
              type="button"
              onClick={() => setActiveSectionId(section.id)}
            >
              {section.menu}
            </button>
          ))}
        </div>
        <div className="admin-sidebar-bottom">
          <AdminSignOut />
        </div>
      </aside>

      <div className="admin-panel stack">
        <p className="muted">Admin</p>
        <h1>운영 관리 화면</h1>
        <p className="muted">
          로그인 계정: {email} / 역할: {role}
        </p>
        <div className="admin-panel-card stack">
          <p className="muted">{activeSection.eyebrow}</p>
          <h2>{activeSection.title}</h2>
          <p className="muted">{activeSection.description}</p>

          {activeSection.id === "content" ? (
            <AdminContentManager initialContent={landingContent} />
          ) : activeSection.id === "pricing" ? (
            <AdminPricingManager initialContent={landingContent} />
          ) : (
            <div className="admin-checklist">
              {activeSection.items?.map((item) => (
                <div key={item} className="admin-check-item">
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
