const manageApp = document.querySelector("#manage-app");

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

function createInput(labelText, name, value = "", options = {}) {
  const label = createElement("label", "manage-label", labelText);
  const input = createElement("input", "manage-input");
  input.name = name;
  input.type = options.type || "text";
  input.value = value;
  if (options.placeholder) {
    input.placeholder = options.placeholder;
  }
  label.append(input);
  return { label, input };
}

function createTextarea(labelText, name, value = "", rows = 4) {
  const label = createElement("label", "manage-label", labelText);
  const textarea = createElement("textarea", "manage-textarea");
  textarea.name = name;
  textarea.rows = rows;
  textarea.value = value;
  label.append(textarea);
  return { label, textarea };
}

function createFileField(labelText, onChange) {
  const label = createElement("label", "manage-label", labelText);
  const input = createElement("input", "manage-file");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", onChange);
  label.append(input);
  return { label, input };
}

function loadImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function optimizeImageFile(file) {
  const source = await loadImageAsDataUrl(file);
  const image = await loadImageElement(source);
  const maxWidth = 1600;
  const scale = Math.min(1, maxWidth / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  context.drawImage(image, 0, 0, width, height);

  let quality = 0.82;
  let result = canvas.toDataURL("image/jpeg", quality);

  while (result.length > 1_400_000 && quality > 0.45) {
    quality -= 0.08;
    result = canvas.toDataURL("image/jpeg", quality);
  }

  return result;
}

function button(label, variant = "primary", type = "button") {
  const element = createElement(
    "button",
    `button button--${variant} cluster cluster--center cluster--sm`,
    label,
  );
  element.type = type;
  return element;
}

function topLinks() {
  return createSiteHeader({
    menuItems: [
      { label: "랜딩 보기", href: "./index.html" },
      { label: "도움말", href: "#manage-help" },
    ],
    logoAlt: "Manage Page",
  });
}

function loginView() {
  const shell = createElement("main", "manage-shell");
  shell.append(topLinks());

  const card = createElement("section", "manage-login stack stack--sm");
  card.append(
    createElement("span", "section-label", "로그인 필요"),
    createElement("h1", "manage-title", "관리페이지 인증"),
    createElement(
      "p",
      "manage-copy",
      "임시 계정으로 로그인한 뒤 랜딩페이지의 제목, 내용, 이미지를 수정할 수 있습니다.",
    ),
  );

  const form = createElement("form", "stack stack--sm");
  const idField = createInput("아이디", "username", "", { placeholder: "admin" });
  const pwField = createInput("비밀번호", "password", "", { type: "password", placeholder: "admin" });
  const status = createElement("p", "manage-status");

  const submit = button("로그인", "primary", "submit");
  form.append(idField.label, pwField.label, submit, status);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (idField.input.value === "admin" && pwField.input.value === "admin") {
      setManageAuthenticated(true);
      renderManagePage();
      return;
    }

    status.textContent = "아이디 또는 비밀번호가 올바르지 않습니다. 임시 계정은 admin/admin 입니다.";
    status.dataset.tone = "error";
  });

  card.append(form);
  shell.append(card);
  return shell;
}

function manageView() {
  const content = getLandingContent();
  const shell = createElement("main", "manage-shell");
  shell.append(topLinks());

  const status = createElement("p", "manage-status");
  const actions = createElement("div", "manage-actions manage-actions--floating");
  const saveButton = button("저장하기");
  const resetButton = button("기본값으로 되돌리기", "secondary");
  const logoutButton = button("로그아웃", "secondary");
  actions.append(saveButton, resetButton, logoutButton);
  shell.append(actions);
  shell.append(status);

  const form = createElement("form", "manage-grid");

  const heroCard = createElement("section", "manage-card manage-card--full stack stack--sm");
  heroCard.append(createElement("span", "section-label", "Hero"));
  const heroBadge = createInput("작은 라벨", "hero.badge", content.hero.badge);
  const heroTitle = createInput("메인 제목", "hero.title", content.hero.title);
  const heroBody = createTextarea("본문", "hero.body", content.hero.body);
  const heroCtaLabel = createInput("CTA 텍스트", "hero.ctaLabel", content.hero.ctaLabel);
  const heroCtaHref = createInput("CTA 링크", "hero.ctaHref", content.hero.ctaHref);
  heroCard.append(heroBadge.label, heroTitle.label, heroBody.label, heroCtaLabel.label, heroCtaHref.label);

  const comparisonCard = createElement("section", "manage-card manage-card--full stack stack--sm");
  comparisonCard.append(createElement("span", "section-label", "Before / After"));
  const comparisonTitle = createInput("섹션 제목", "comparison.sectionTitle", content.comparison.sectionTitle);
  const beforeLabel = createInput("Before 라벨", "comparison.beforeLabel", content.comparison.beforeLabel);
  const beforeText = createTextarea("Before 설명", "comparison.beforeText", content.comparison.beforeText);
  const beforePreview = createElement("img", "manage-preview");
  beforePreview.src = content.comparison.beforeImage;
  beforePreview.alt = "Before preview";
  const beforeFile = createFileField("Before 이미지 업로드", async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await optimizeImageFile(file);
      beforePreview.src = dataUrl;
      beforePreview.dataset.value = dataUrl;
      status.textContent = "Before 이미지를 최적화해서 준비했습니다. 저장하기를 눌러 반영하세요.";
      status.dataset.tone = "success";
    } catch (error) {
      status.textContent = "Before 이미지를 처리하지 못했습니다. 다른 이미지로 다시 시도해주세요.";
      status.dataset.tone = "error";
    }
  });

  const afterLabel = createInput("After 라벨", "comparison.afterLabel", content.comparison.afterLabel);
  const afterText = createTextarea("After 설명", "comparison.afterText", content.comparison.afterText);
  const afterPreview = createElement("img", "manage-preview");
  afterPreview.src = content.comparison.afterImage;
  afterPreview.alt = "After preview";
  const afterFile = createFileField("After 이미지 업로드", async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await optimizeImageFile(file);
      afterPreview.src = dataUrl;
      afterPreview.dataset.value = dataUrl;
      status.textContent = "After 이미지를 최적화해서 준비했습니다. 저장하기를 눌러 반영하세요.";
      status.dataset.tone = "success";
    } catch (error) {
      status.textContent = "After 이미지를 처리하지 못했습니다. 다른 이미지로 다시 시도해주세요.";
      status.dataset.tone = "error";
    }
  });

  comparisonCard.append(
    comparisonTitle.label,
    beforeLabel.label,
    beforeText.label,
    beforePreview,
    beforeFile.label,
    afterLabel.label,
    afterText.label,
    afterPreview,
    afterFile.label,
  );

  const reviewsCard = createElement("section", "manage-card manage-card--full stack stack--sm");
  reviewsCard.append(createElement("span", "section-label", "Reviews"));
  const reviewsTitle = createInput("리뷰 섹션 제목", "reviews.sectionTitle", content.reviews.sectionTitle);
  reviewsCard.append(reviewsTitle.label);

  const reviewFields = [];
  content.reviews.items.forEach((item, index) => {
    const wrapper = createElement("fieldset", "manage-fieldset stack stack--sm");
    wrapper.append(createElement("span", "section-label", `리뷰 ${index + 1}`));
    const quote = createTextarea("리뷰 내용", `reviews.items.${index}.quote`, item.quote, 3);
    const name = createInput("이름", `reviews.items.${index}.name`, item.name);
    const detail = createInput("직함", `reviews.items.${index}.detail`, item.detail);
    wrapper.append(quote.label, name.label, detail.label);
    reviewsCard.append(wrapper);
    reviewFields.push({ quote, name, detail, variant: item.variant, rating: item.rating });
  });

  const footerCard = createElement("section", "manage-card manage-card--full stack stack--sm");
  footerCard.append(createElement("span", "section-label", "Footer"));
  const footerCompany = createInput("회사명", "footer.company", content.footer.company);
  const footerAddress = createInput("주소", "footer.address", content.footer.address);
  footerCard.append(footerCompany.label, footerAddress.label);

  const footerLinkFields = [];
  content.footer.links.forEach((item, index) => {
    const wrapper = createElement("fieldset", "manage-fieldset stack stack--sm");
    wrapper.append(createElement("span", "section-label", `푸터 링크 ${index + 1}`));
    const labelField = createInput("링크 텍스트", `footer.links.${index}.label`, item.label);
    const hrefField = createInput("링크 주소", `footer.links.${index}.href`, item.href);
    wrapper.append(labelField.label, hrefField.label);
    footerCard.append(wrapper);
    footerLinkFields.push({ labelField, hrefField });
  });

  form.append(heroCard, comparisonCard, reviewsCard, footerCard);
  shell.append(form);

  saveButton.addEventListener("click", () => {
    try {
      const next = {
        hero: {
          badge: heroBadge.input.value,
          title: heroTitle.input.value,
          body: heroBody.textarea.value,
          ctaLabel: heroCtaLabel.input.value,
          ctaHref: heroCtaHref.input.value,
        },
        comparison: {
          sectionTitle: comparisonTitle.input.value,
          beforeLabel: beforeLabel.input.value,
          beforeText: beforeText.textarea.value,
          beforeImage: beforePreview.dataset.value || content.comparison.beforeImage,
          afterLabel: afterLabel.input.value,
          afterText: afterText.textarea.value,
          afterImage: afterPreview.dataset.value || content.comparison.afterImage,
        },
        reviews: {
          sectionTitle: reviewsTitle.input.value,
          items: reviewFields.map((field) => ({
            quote: field.quote.textarea.value,
            name: field.name.input.value,
            detail: field.detail.input.value,
            variant: field.variant,
            rating: field.rating,
          })),
        },
        footer: {
          company: footerCompany.input.value,
          address: footerAddress.input.value,
          links: footerLinkFields.map((field) => ({
            label: field.labelField.input.value,
            href: field.hrefField.input.value,
          })),
        },
      };

      saveLandingContent(next);
      status.textContent = "저장되었습니다. index.html에서 바로 확인할 수 있습니다.";
      status.dataset.tone = "success";
    } catch (error) {
      status.textContent = "저장에 실패했습니다. 이미지 용량이 너무 클 수 있습니다. 더 작은 이미지를 사용해보세요.";
      status.dataset.tone = "error";
    }
  });

  resetButton.addEventListener("click", () => {
    resetLandingContent();
    status.textContent = "기본값으로 초기화했습니다. 페이지를 새로 열면 기본 랜딩이 보입니다.";
    status.dataset.tone = "success";
    renderManagePage();
  });

  logoutButton.addEventListener("click", () => {
    setManageAuthenticated(false);
    renderManagePage();
  });

  const help = createElement(
    "p",
    "manage-help",
    "나중에 Firebase 이메일 인증으로 바꿀 때는 현재 로그인 체크와 localStorage 저장 부분만 교체하면 됩니다.",
  );
  help.id = "manage-help";
  shell.append(help);

  return shell;
}

function renderManagePage() {
  manageApp.innerHTML = "";
  manageApp.append(isManageAuthenticated() ? manageView() : loginView());
}

renderManagePage();
