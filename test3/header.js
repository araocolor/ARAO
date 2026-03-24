function createHeaderElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}

function createSiteHeader(options = {}) {
  const {
    logoHref = "./index.html",
    logoSrc = "./logo.svg",
    logoAlt = "Landing Page",
    menuItems = [],
  } = options;

  const header = createHeaderElement("header", "site-header");
  const inner = createHeaderElement("div", "site-header__inner cluster cluster--between cluster--md");

  const logoLink = createHeaderElement("a", "site-header__logo-link");
  logoLink.href = logoHref;
  logoLink.setAttribute("aria-label", logoAlt);

  const logo = createHeaderElement("img", "site-header__logo");
  logo.src = logoSrc;
  logo.alt = logoAlt;
  logoLink.append(logo);

  const nav = createHeaderElement("nav", "site-header__nav");
  menuItems.forEach(({ label, href }) => {
    const link = createHeaderElement("a", "site-header__link", label);
    link.href = href;
    nav.append(link);
  });

  inner.append(logoLink, nav);
  header.append(inner);
  return header;
}
