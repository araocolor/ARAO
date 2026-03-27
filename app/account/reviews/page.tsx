export default function AccountReviewsPage() {
  const items = [
    "작성 후기 목록",
    "노출 여부 확인",
    "후기 수정 준비",
  ];

  return (
    <div className="admin-panel-card stack">
      <p className="muted">Reviews</p>
      <h2>나의 후기</h2>
      <p className="muted">작성한 후기와 공개 상태를 확인하고 수정 흐름을 연결할 수 있도록 비워둔 영역입니다.</p>
      <div className="admin-checklist">
        {items.map((item) => (
          <div key={item} className="admin-check-item">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
