"use client";

import { LandingAuthControls, LandingAuthControlsCompact } from "@/components/landing-auth-controls";
import { HeaderProfileLink } from "@/components/header-profile-link";
import { HeaderLogoutButton } from "@/components/header-logout-button";
import { SiteHeader } from "@/components/site-header";

export function LandingPageHeader() {
  const links = [
    { href: "/arao", label: "ARAO 소개" },
    { href: "/gallery", label: "갤러리" },
    { href: "/user_review", label: "커뮤니티" },
    { href: "/manual", label: "설치방법" },
    { href: "/pricing", label: "구매가이드" },
    { href: "/account/general", label: "사용자설정", divider: true },
  ];

  return (
    <SiteHeader
      fullWidth
      menuHeader="Arao Project"
      leading={<LandingAuthControls />}
      mobileLeading={<LandingAuthControlsCompact />}
      mobileProfile={<HeaderProfileLink />}
      mobileLogout={<HeaderLogoutButton />}
      links={links}
    />
  );
}
