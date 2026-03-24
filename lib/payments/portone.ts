type PortOneCheckoutPayload = {
  orderId: string;
  amount: number;
  customerName: string;
};

export async function createPortOneCheckout(payload: PortOneCheckoutPayload) {
  return {
    provider: "portone",
    status: "stub",
    payload,
  };
}
