export default function AccountOrdersPage() {
  const items = [
    "최근 주문 목록",
    "주문 상태 추적",
    "결제 내역 확인",
  ];

  return (
    <div className="admin-panel-card stack">
      <p className="muted">Orders</p>
      <h2>주문내역</h2>
      <p className="muted">구매한 상품과 진행 중인 주문, 결제 상태를 한 곳에서 확인할 수 있도록 준비된 영역입니다.</p>
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
