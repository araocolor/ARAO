import { LandingAuthControls, LandingAuthControlsCompact } from "@/components/landing-auth-controls";
import { HeaderProfileLink } from "@/components/header-profile-link";
import { SiteHeader } from "@/components/site-header";

export function LandingPageHeader() {
  return (
    <SiteHeader
      fullWidth
      leading={<LandingAuthControls />}
      mobileLeading={<LandingAuthControlsCompact />}
      mobileProfile={<HeaderProfileLink />}
      links={[
        { href: "/arao", label: "Arao" },
        { href: "/gallery", label: "Gallery" },
        { href: "/pricing", label: "Buy" },
        { href: "/manual", label: "Manual" },
      ]}
    />
  );
}
