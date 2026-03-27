import Link from "next/link";

export default function AccountWithdrawPage() {
  return (
    <div className="admin-panel-card stack">
      <h2>회원탈퇴</h2>
      <div className="muted">탈퇴 기능은 아직 최종 연결 전입니다. 진행 전에 주문, 상담, 후기 데이터 보존 정책을 먼저 정리하는 것이 안전합니다.</div>
      <Link className="account-delete-inline" href="/account/general">
        계정 페이지로 돌아가기
      </Link>
    </div>
  );
}
