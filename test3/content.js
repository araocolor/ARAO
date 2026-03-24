const STORAGE_KEY = "landing-page-content-v1";
const AUTH_KEY = "landing-page-manage-auth";

const DEFAULT_CONTENT = {
  hero: {
    badge: "Apple-inspired mobile landing",
    title: "복잡한 전환 과정을 더 단순하고 아름답게.",
    body: "작은 화면에서도 여유 있게 읽히는 구조와 부드러운 카드 인터랙션으로 첫 인상을 정리했습니다.",
    ctaLabel: "지금 시작하기",
    ctaHref: "#gallery",
  },
  comparison: {
    sectionTitle: "Before / After",
    beforeLabel: "Before",
    beforeText: "정보가 분산되고 메시지가 흐려져 핵심이 바로 들어오지 않는 상태",
    beforeImage: "./images/before.jpg",
    afterLabel: "After",
    afterText: "여백, 시선 흐름, 명확한 CTA로 한 번에 이해되는 iOS 스타일 랜딩 구조",
    afterImage: "./images/after.jpg",
  },
  reviews: {
    sectionTitle: "사용자 리뷰",
    items: [
      {
        quote: "한 번에 비교가 되니까 결정을 훨씬 빨리 내릴 수 있었어요.",
        name: "민지",
        detail: "프로덕트 디자이너",
        rating: "★★★★★",
        variant: "review",
      },
      {
        quote: "복잡한 설명 없이 화면만 봐도 변화가 명확하게 느껴졌습니다.",
        name: "도윤",
        detail: "마케팅 리드",
        rating: "★★★★★",
        variant: "glass",
      },
      {
        quote: "모바일에서 보는 순간 바로 신뢰감이 들 정도로 정돈된 인상이었어요.",
        name: "서연",
        detail: "브랜드 매니저",
        rating: "★★★★★",
        variant: "review",
      },
      {
        quote: "여백과 타이포가 깔끔해서 iPhone 앱 소개 페이지처럼 느껴졌어요.",
        name: "지훈",
        detail: "스타트업 운영",
        rating: "★★★★★",
        variant: "glass",
      },
    ],
  },
  footer: {
    company: "ABC Studio",
    address: "서울특별시 성동구 성수이로 00",
    links: [
      { label: "이용약관", href: "#" },
      { label: "개인정보처리방침", href: "#" },
      { label: "고객지원", href: "#" },
    ],
  },
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getLandingContent() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return deepClone(DEFAULT_CONTENT);
    }

    const parsed = JSON.parse(raw);
    return {
      ...deepClone(DEFAULT_CONTENT),
      ...parsed,
      hero: {
        ...deepClone(DEFAULT_CONTENT.hero),
        ...(parsed.hero || {}),
      },
      comparison: {
        ...deepClone(DEFAULT_CONTENT.comparison),
        ...(parsed.comparison || {}),
      },
      reviews: {
        ...deepClone(DEFAULT_CONTENT.reviews),
        ...(parsed.reviews || {}),
        items: Array.isArray(parsed.reviews?.items) && parsed.reviews.items.length
          ? parsed.reviews.items.map((item, index) => ({
              ...deepClone(DEFAULT_CONTENT.reviews.items[index] || DEFAULT_CONTENT.reviews.items[0]),
              ...item,
            }))
          : deepClone(DEFAULT_CONTENT.reviews.items),
      },
      footer: {
        ...deepClone(DEFAULT_CONTENT.footer),
        ...(parsed.footer || {}),
        links: Array.isArray(parsed.footer?.links) && parsed.footer.links.length
          ? parsed.footer.links.map((link, index) => ({
              ...deepClone(DEFAULT_CONTENT.footer.links[index] || DEFAULT_CONTENT.footer.links[0]),
              ...link,
            }))
          : deepClone(DEFAULT_CONTENT.footer.links),
      },
    };
  } catch (error) {
    return deepClone(DEFAULT_CONTENT);
  }
}

function saveLandingContent(content) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  return true;
}

function resetLandingContent() {
  window.localStorage.removeItem(STORAGE_KEY);
}

function isManageAuthenticated() {
  return window.localStorage.getItem(AUTH_KEY) === "true";
}

function setManageAuthenticated(value) {
  if (value) {
    window.localStorage.setItem(AUTH_KEY, "true");
    return;
  }

  window.localStorage.removeItem(AUTH_KEY);
}
