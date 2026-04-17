const PAYMENT_PENDING_PREFIX = "color-order-payment-pending";

function getPaymentPendingKey(colorId: string) {
  return `${PAYMENT_PENDING_PREFIX}-${colorId}`;
}

export function markPendingColorOrder(colorId: string) {
  try {
    sessionStorage.setItem(
      getPaymentPendingKey(colorId),
      JSON.stringify({ startedAt: Date.now() })
    );
  } catch {}
}

export function clearPendingColorOrder(colorId: string) {
  try {
    sessionStorage.removeItem(getPaymentPendingKey(colorId));
  } catch {}
}

export function hasPendingColorOrder(colorId: string) {
  try {
    return sessionStorage.getItem(getPaymentPendingKey(colorId)) !== null;
  } catch {
    return false;
  }
}
