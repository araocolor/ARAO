import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
});

export async function createStripeCheckoutSession({
  amount,
  orderId,
}: {
  amount: number;
  orderId: string;
}) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Order ${orderId}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel`,
  });
}
