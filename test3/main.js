const app = document.querySelector("#app");
const content = getLandingContent();

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}

function Button({ label, href = "#", variant = "primary", withIcon = false }) {
  const button = createElement(
    "a",
    `button button--${variant} cluster cluster--center cluster--sm`,
  );
  button.href = href;
  button.setAttribute("aria-label", label);

  if (withIcon) {
    button.append(createElement("span", "button__icon"));
  }

  button.append(label);
  return button;
}

function Card({ variant = "review", children = [] }) {
  const card = createElement("article", `card card--${variant} stack stack--xs`);
  children.forEach((child) => card.append(child));
  return card;
}

function Review({ quote, name, detail, rating, variant }) {
  const quoteEl = createElement("p", "review-card__quote", quote);
  const ratingEl = createElement("div", "review-card__rating", rating);

  const meta = createElement("div", "review-card__meta stack stack--xs");
  meta.append(
    createElement("p", "review-card__name", name),
    createElement("p", "review-card__detail", detail),
  );

  return Card({
    variant,
    children: [quoteEl, ratingEl, meta],
  });
}

function HeroSection(data) {
  const section = createElement("section", "hero stack stack--sm");
  section.id = "intro";
  section.append(
    createElement("span", "section-label", data.badge),
    createElement("h1", "hero__title", data.title),
    createElement("p", "hero__body", data.body),
    Button({
      label: data.ctaLabel,
      href: data.ctaHref,
      variant: "primary",
      withIcon: true,
    }),
  );

  return section;
}

function ComparisonSection(data) {
  const wrapper = createElement("section", "stack stack--sm");
  wrapper.id = "gallery";
  wrapper.append(createElement("span", "section-label", data.sectionTitle));

  const section = createElement("div", "comparison stack");

  const before = createElement("article", "comparison__item stack stack--sm");
  before.style.setProperty(
    "--image",
    [
      `url("${data.beforeImage}")`,
      "linear-gradient(135deg, rgba(118, 118, 128, 0.3), rgba(86, 86, 94, 0.24))",
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), transparent 30%)",
    ].join(", "),
  );
  before.append(
    createElement("div", "comparison__label", data.beforeLabel),
    createElement("p", "comparison__text", data.beforeText),
  );

  const after = createElement("article", "comparison__item stack stack--sm");
  after.style.setProperty(
    "--image",
    [
      `url("${data.afterImage}")`,
      "linear-gradient(140deg, rgba(248, 248, 250, 0.18), rgba(182, 208, 255, 0.14))",
      "radial-gradient(circle at 70% 20%, rgba(255,255,255,0.18), transparent 25%)",
    ].join(", "),
  );
  after.append(
    createElement("div", "comparison__label", data.afterLabel),
    createElement("p", "comparison__text", data.afterText),
  );

  section.append(before, after);
  wrapper.append(section);
  return wrapper;
}

function ReviewsSection(data) {
  const wrapper = createElement("section", "stack stack--sm");
  wrapper.id = "pricing";
  wrapper.append(createElement("span", "section-label", data.sectionTitle));

  const grid = createElement("div", "reviews");
  data.items.forEach((item) => grid.append(Review(item)));
  wrapper.append(grid);

  return wrapper;
}

function FooterSection(data) {
  const footer = createElement("footer", "footer cluster cluster--between cluster--md");
  footer.id = "help";

  const brand = createElement("div", "footer__brand");
  brand.append(
    createElement("p", "footer__company", data.company),
    createElement("p", "footer__text", data.address),
  );

  const links = createElement("nav", "footer__links");
  data.links.forEach(({ label, href }) => {
    const link = createElement("a", "footer__link", label);
    link.href = href;
    links.append(link);
  });

  const manageLink = createElement("a", "footer__link footer__manage-link", "admin");
  manageLink.href = "./manage.html";
  links.append(manageLink);

  footer.append(brand, links);
  return footer;
}

function App() {
  const page = createElement("main", "page-shell");
  const header = createSiteHeader({
    menuItems: [
      { label: "소개", href: "#intro" },
      { label: "갤러리", href: "#gallery" },
      { label: "가격", href: "#pricing" },
      { label: "도움말", href: "#help" },
    ],
  });

  page.append(
    header,
    HeroSection(content.hero),
    ComparisonSection(content.comparison),
    ReviewsSection(content.reviews),
    FooterSection(content.footer),
  );

  return page;
}

app.append(App());
