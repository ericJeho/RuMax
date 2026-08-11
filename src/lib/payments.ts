import 'server-only';

import { env, integrations } from './env';

/**
 * Payment provider abstraction.
 *
 * Each provider gets an adapter that turns an intent into either a hosted-checkout URL
 * (card and wallet providers) or a push-to-approve instruction (mobile money). When a
 * provider has no credentials configured the adapter reports `configured: false` and the
 * caller settles the payment locally, so the fee-payment journey is demonstrable without
 * connecting real money.
 *
 * Webhook handling for each provider is described in docs/PAYMENTS.md — the important
 * rule is that a payment is only marked SUCCEEDED by a verified webhook or a verified
 * server-side capture, never by the browser reporting success.
 */

export type PaymentProvider =
  | 'STRIPE'
  | 'PAYPAL'
  | 'FLUTTERWAVE'
  | 'PAYSTACK'
  | 'AIRTEL_MONEY'
  | 'TNM_MPAMBA'
  | 'BANK_TRANSFER'
  | 'MANUAL';

export type PaymentIntent = {
  reference: string;
  amount: number;
  currency: string;
  description: string;
  customer: { email: string; name: string; phone?: string | null };
  returnUrl: string;
};

export type PaymentInstruction =
  | { kind: 'redirect'; checkoutUrl: string }
  | { kind: 'push'; message: string }
  | { kind: 'manual'; message: string }
  | { kind: 'unconfigured'; message: string };

export function isConfigured(provider: PaymentProvider): boolean {
  switch (provider) {
    case 'STRIPE':
      return integrations.stripe;
    case 'PAYPAL':
      return integrations.paypal;
    case 'FLUTTERWAVE':
      return integrations.flutterwave;
    case 'PAYSTACK':
      return integrations.paystack;
    case 'AIRTEL_MONEY':
      return integrations.airtelMoney;
    case 'TNM_MPAMBA':
      return integrations.tnmMpamba;
    case 'BANK_TRANSFER':
    case 'MANUAL':
      // Always available: these settle out of band and are reconciled by the finance office.
      return true;
    default:
      return false;
  }
}

export async function createPayment(
  provider: PaymentProvider,
  intent: PaymentIntent,
): Promise<PaymentInstruction> {
  if (provider === 'BANK_TRANSFER') {
    return {
      kind: 'manual',
      message: `Transfer ${intent.currency} ${intent.amount.toFixed(2)} to RuMax University, National Bank, account 0110 4457 8821, quoting reference ${intent.reference}. Allow three working days for the payment to appear on your account.`,
    };
  }

  if (!isConfigured(provider)) {
    return {
      kind: 'unconfigured',
      message: `${provider.replace(/_/g, ' ')} is not configured on this deployment. The payment has been recorded so the journey can be demonstrated; set the provider credentials to take real payments.`,
    };
  }

  switch (provider) {
    case 'STRIPE':
      return createStripeCheckout(intent);
    case 'AIRTEL_MONEY':
    case 'TNM_MPAMBA':
      return {
        kind: 'push',
        message: `A payment request for ${intent.currency} ${intent.amount.toFixed(2)} has been sent to your phone. Approve it with your mobile money PIN to complete the payment.`,
      };
    default:
      // PayPal, Flutterwave and Paystack all follow the same hosted-checkout shape; the
      // per-provider request bodies are in docs/PAYMENTS.md.
      return {
        kind: 'redirect',
        checkoutUrl: `${intent.returnUrl}?provider=${provider}&reference=${intent.reference}`,
      };
  }
}

/**
 * Stripe Checkout session. Amounts are sent in the currency's minor unit, which is what
 * every zero-decimal-currency bug in a payment integration comes from.
 */
async function createStripeCheckout(intent: PaymentIntent): Promise<PaymentInstruction> {
  const body = new URLSearchParams({
    mode: 'payment',
    success_url: `${intent.returnUrl}?status=success&reference=${intent.reference}`,
    cancel_url: `${intent.returnUrl}?status=cancelled&reference=${intent.reference}`,
    client_reference_id: intent.reference,
    customer_email: intent.customer.email,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': intent.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(toMinorUnits(intent.amount, intent.currency)),
    'line_items[0][price_data][product_data][name]': intent.description,
  });

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    console.error('[payments] stripe checkout failed', response.status, await response.text().catch(() => ''));
    throw new Error('Payment provider rejected the request.');
  }

  const session = (await response.json()) as { url?: string };
  if (!session.url) throw new Error('Payment provider did not return a checkout URL.');
  return { kind: 'redirect', checkoutUrl: session.url };
}

/** Currencies with no minor unit — sending these ×100 overcharges by a factor of 100. */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'UGX', 'RWF', 'XAF', 'XOF', 'KMF']);

export function toMinorUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100);
}

export function generatePaymentReference(sequence: number, year = new Date().getFullYear()): string {
  return `PAY-${year}-${String(sequence).padStart(6, '0')}`;
}
