import Link from "next/link";
import type { LandingContent } from "@/lib/landing-content";

type LandingPageFooterProps = {
  content: LandingContent["footer"];
};

export function LandingPageFooter({ content }: LandingPageFooterProps) {
  return (
    <footer className="landing-footer" id="help">
      <div className="landing-footer-brand">
        <p className="landing-footer-company">{content.company}</p>
        <p className="landing-footer-text">{content.address}</p>
      </div>
      <nav className="landing-footer-links">
        {content.links.map((link) => (
          <a key={link.label} className="landing-footer-link" href={link.href}>
            {link.label}
          </a>
        ))}
        <Link className="landing-footer-link" href="/admin">
          admin
        </Link>
      </nav>
    </footer>
  );
}
