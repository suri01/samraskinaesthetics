import Stripe from "stripe";

export function stripeMode(): "live-test" | "mocked" {
  return process.env.STRIPE_SECRET_KEY ? "live-test" : "mocked";
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-08-27.basil" });
}

export async function createPaymentIntent(input: {
  amountPence: number;
  currency: string;
  invoiceId: string;
  customerEmail?: string | null;
}): Promise<{ provider: string; providerRef: string; mocked: boolean; clientSecret?: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return {
      provider: "mock",
      providerRef: `mock_pi_${input.invoiceId.slice(0, 8)}`,
      mocked: true,
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount: input.amountPence,
    currency: input.currency.toLowerCase(),
    metadata: { invoiceId: input.invoiceId },
    receipt_email: input.customerEmail ?? undefined,
    automatic_payment_methods: { enabled: true },
  });

  return {
    provider: "stripe",
    providerRef: intent.id,
    mocked: false,
    clientSecret: intent.client_secret ?? undefined,
  };
}
