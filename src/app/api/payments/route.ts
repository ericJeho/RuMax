import { z } from 'zod';

import { audit, badRequest, created, handleError, notFound, parseBody, rateLimitOrThrow } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPayment, generatePaymentReference, type PaymentProvider } from '@/lib/payments';
import { env } from '@/lib/env';

const schema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive().max(1_000_000),
  provider: z.enum([
    'STRIPE',
    'PAYPAL',
    'FLUTTERWAVE',
    'PAYSTACK',
    'AIRTEL_MONEY',
    'TNM_MPAMBA',
    'BANK_TRANSFER',
  ]),
});

/**
 * POST /api/payments — start a payment against one of the caller's own invoices.
 *
 * The invoice is re-read server-side and the amount is validated against its balance:
 * the client's idea of what is owed is never trusted.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    rateLimitOrThrow(`payment:${user.id}`, 12, 60_000);

    const body = await parseBody(request, schema);

    const invoice = await prisma.invoice.findUnique({ where: { id: body.invoiceId } });
    if (!invoice || invoice.userId !== user.id) throw notFound('Invoice');

    const balance = Number(invoice.amount) - Number(invoice.amountPaid);
    if (balance <= 0) throw badRequest('This invoice is already settled.');
    if (body.amount > balance + 0.001) {
      throw badRequest(`The most you can pay against this invoice is ${balance.toFixed(2)}.`);
    }

    const sequence = (await prisma.payment.count()) + 1;
    const reference = generatePaymentReference(sequence);

    const instruction = await createPayment(body.provider as PaymentProvider, {
      reference,
      amount: body.amount,
      currency: invoice.currency,
      description: `${invoice.description} (${invoice.invoiceNumber})`,
      customer: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
      },
      returnUrl: `${env.NEXT_PUBLIC_SITE_URL}/portal/finance`,
    });

    // A payment only counts once the provider confirms it. Redirect and push flows stay
    // PENDING until their webhook arrives; unconfigured providers and bank transfers are
    // settled here so the journey completes on a demonstration deployment.
    const settledNow = instruction.kind === 'unconfigured';

    const payment = await prisma.payment.create({
      data: {
        reference,
        invoiceId: invoice.id,
        userId: user.id,
        amount: body.amount,
        currency: invoice.currency,
        provider: body.provider,
        status: settledNow ? 'SUCCEEDED' : 'PENDING',
        paidAt: settledNow ? new Date() : null,
        receiptUrl: settledNow ? `/api/payments/${reference}/receipt` : null,
        metadata: { instruction: instruction.kind },
      },
    });

    if (settledNow) {
      const amountPaid = Number(invoice.amountPaid) + body.amount;
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid,
          status: amountPaid >= Number(invoice.amount) ? 'PAID' : 'PARTIALLY_PAID',
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Payment received',
          body: `${invoice.currency} ${body.amount.toFixed(2)} received against ${invoice.invoiceNumber}.`,
          link: '/portal/finance',
          category: 'finance',
        },
      });
    }

    await audit({
      userId: user.id,
      action: 'payment.create',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { provider: body.provider, amount: body.amount, settledNow },
    });

    return created({
      reference,
      status: payment.status,
      checkoutUrl: instruction.kind === 'redirect' ? instruction.checkoutUrl : undefined,
      message: 'message' in instruction ? instruction.message : undefined,
    });
  } catch (error) {
    return handleError(error);
  }
}
