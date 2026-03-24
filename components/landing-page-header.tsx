import { LandingAuthControls } from "@/components/landing-auth-controls";
import { SiteHeader } from "@/components/site-header";

export function LandingPageHeader() {
  return (
    <SiteHeader
      fullWidth
      leading={<LandingAuthControls />}
      links={[
        { href: "/arao", label: "Arao" },
        { href: "/gallery", label: "Gallery" },
        { href: "/pricing", label: "Buy" },
        { href: "/manual", label: "Manual" },
      ]}
    />
  );
}
