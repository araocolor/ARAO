import { Fragment } from "react";

type CompanyFooterLink = {
  label: string;
  href: string;
};

type CompanyFooterProps = {
  address: string;
  links: CompanyFooterLink[];
  onOpenLegalSheet: (type: "terms" | "privacy") => void;
};

export function CompanyFooter({ address, links, onOpenLegalSheet }: CompanyFooterProps) {
  return (
    <>
      <div className="landing-footer-brand">
        <p className="landing-footer-text">{address}</p>
      </div>
      <nav className="landing-footer-links">
        {links.map((link, index) => {
          const legalType =
            link.label === "개인정보처리방침" ? "privacy" :
            link.label === "이용약관" ? "terms" : null;

          return (
            <Fragment key={link.label}>
              {index > 0 && <span className="landing-footer-link-divider" aria-hidden="true">|</span>}
              {legalType ? (
                <button
                  type="button"
                  className="landing-footer-link landing-footer-link-button"
                  onClick={() => onOpenLegalSheet(legalType)}
                >
                  {link.label}
                </button>
              ) : (
                <a className="landing-footer-link" href={link.href}>
                  {link.label}
                </a>
              )}
            </Fragment>
          );
        })}
      </nav>
      <p className="landing-footer-copyright">© 2026 아라오(ARAO) | All rights reserved.</p>
      <div className="landing-footer-socials-brand">
        <a
          className="landing-footer-social-brand"
          href="https://www.instagram.com/arao.color/"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
        >
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="30" />
            <rect x="17" y="17" width="30" height="30" rx="9" />
            <circle cx="32" cy="32" r="7.5" />
            <circle cx="41.5" cy="22.5" r="2" />
          </svg>
        </a>
        <a
          className="landing-footer-social-brand"
          href="https://www.facebook.com"
          target="_blank"
          rel="noreferrer"
          aria-label="Facebook"
        >
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="30" />
            <path d="M35.2 22h6.4v-6.8h-7.4c-8 0-12 4.8-12 12.5v6h-6.8v7.8h6.8V58h8.1V41.5h7.2l1.1-7.8h-8.3v-5.2c0-2.7.8-4.5 4.9-4.5z" />
          </svg>
        </a>
        <a
          className="landing-footer-social-brand"
          href="https://www.youtube.com/@Araocolor"
          target="_blank"
          rel="noreferrer"
          aria-label="YouTube"
        >
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="30" />
            <rect x="15" y="21" width="34" height="22" rx="7" />
            <path d="M29 27.5 40 32 29 36.5z" />
          </svg>
        </a>
      </div>
    </>
  );
}
