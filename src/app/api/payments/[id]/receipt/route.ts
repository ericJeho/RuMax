import { handleError, notFound } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payments/:id/receipt
 *
 * `:id` accepts either the payment's primary key or its public reference, because the
 * reference is what appears on statements and is what students actually have to hand.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const payment = await prisma.payment.findFirst({
      where: { OR: [{ id }, { reference: id }] },
      include: { invoice: { select: { invoiceNumber: true, description: true } } },
    });

    // Finance staff and administrators may retrieve any receipt; students only their own.
    const privileged = ['ADMIN', 'FINANCE'].includes(user.role);
    if (!payment || (!privileged && payment.userId !== user.id)) throw notFound('Receipt');

    const receipt = {
      receiptFor: SITE.name,
      issuedBy: `${SITE.name}, ${SITE.address}`,
      registration: SITE.registrationNumber,
      reference: payment.reference,
      invoice: payment.invoice?.invoiceNumber ?? null,
      description: payment.invoice?.description ?? 'Payment to the university',
      payer: { name: `${user.firstName} ${user.lastName}`, studentNumber: user.studentNumber },
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.provider,
      status: payment.status,
      paidAt: payment.paidAt,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(receipt, null, 2), {
      headers: {
        'content-type': 'application/json',
        'content-disposition': `attachment; filename="receipt-${payment.reference}.json"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
