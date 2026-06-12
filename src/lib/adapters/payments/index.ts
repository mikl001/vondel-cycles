import "server-only";

export type PaymentStatus =
  | "open"
  | "paid"
  | "failed"
  | "canceled"
  | "expired";

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  locale: string;
  /** localized URL of the local demo payment page (used by the mock adapter) */
  demoCheckoutUrl: string;
}

export interface PaymentAdapter {
  provider: "mollie" | "mock";
  createPayment(
    input: CreatePaymentInput,
  ): Promise<{ paymentId: string; checkoutUrl: string }>;
  /** Source of truth for webhooks — never trust the webhook body. */
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

const MOLLIE_API = "https://api.mollie.com/v2";

/** Real Mollie client (test mode with a test_ key). iDEAL/cards via the
 *  hosted checkout — PCI stays fully delegated. */
function createMollieAdapter(apiKey: string): PaymentAdapter {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  return {
    provider: "mollie",
    async createPayment(input) {
      const res = await fetch(`${MOLLIE_API}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: {
            currency: "EUR",
            value: (input.amountCents / 100).toFixed(2),
          },
          description: input.description,
          redirectUrl: input.redirectUrl,
          webhookUrl: input.webhookUrl,
          locale: input.locale === "nl" ? "nl_NL" : "en_US",
          metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
        }),
      });
      if (!res.ok) {
        throw new Error(`Mollie createPayment failed: ${res.status} ${await res.text()}`);
      }
      const data = (await res.json()) as {
        id: string;
        _links: { checkout: { href: string } };
      };
      return { paymentId: data.id, checkoutUrl: data._links.checkout.href };
    },
    async getPaymentStatus(paymentId) {
      const res = await fetch(`${MOLLIE_API}/payments/${paymentId}`, { headers });
      if (!res.ok) {
        throw new Error(`Mollie getPayment failed: ${res.status}`);
      }
      const data = (await res.json()) as { status: string };
      const map: Record<string, PaymentStatus> = {
        paid: "paid",
        failed: "failed",
        canceled: "canceled",
        expired: "expired",
      };
      return map[data.status] ?? "open";
    },
  };
}

/**
 * Local/dev stand-in: "checkout" is our own demo payment page, which posts
 * the outcome straight to the finalizer. Status transitions therefore happen
 * synchronously — getPaymentStatus only answers for late webhook retries.
 */
function createMockAdapter(): PaymentAdapter {
  return {
    provider: "mock",
    async createPayment(input) {
      return { paymentId: `mock_${input.orderId}`, checkoutUrl: input.demoCheckoutUrl };
    },
    async getPaymentStatus() {
      return "open";
    },
  };
}

export function getPaymentAdapter(): PaymentAdapter {
  const key = process.env.MOLLIE_API_KEY;
  return key ? createMollieAdapter(key) : createMockAdapter();
}
