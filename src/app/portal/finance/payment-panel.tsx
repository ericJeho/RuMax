'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Alert, Button, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { Field, Input, Select } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';
import { formatCurrency } from '@/lib/format';

type PayableInvoice = {
  id: string;
  invoiceNumber: string;
  description: string;
  balance: number;
  currency: string;
};

const PROVIDERS = [
  { value: 'STRIPE', label: 'Card (Visa / MasterCard) — Stripe' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'FLUTTERWAVE', label: 'Flutterwave' },
  { value: 'PAYSTACK', label: 'Paystack' },
  { value: 'AIRTEL_MONEY', label: 'Airtel Money' },
  { value: 'TNM_MPAMBA', label: 'TNM Mpamba' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
];

export function PaymentPanel({ invoices }: { invoices: PayableInvoice[] }) {
  const router = useRouter();
  const toast = useToast();
  const [invoiceId, setInvoiceId] = useState(invoices[0]?.id ?? '');
  const [amount, setAmount] = useState(String(invoices[0]?.balance ?? ''));
  const [provider, setProvider] = useState('STRIPE');
  const [pending, setPending] = useState(false);

  const selected = invoices.find((i) => i.id === invoiceId);

  async function pay() {
    setPending(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ invoiceId, amount: Number(amount), provider }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Payment failed', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      // With live credentials the API returns the provider's hosted checkout URL and we
      // hand the browser over to it. Without them it settles the payment locally so the
      // flow is demonstrable end to end.
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      toast.push({
        tone: 'success',
        title: 'Payment recorded',
        body: `${formatCurrency(Number(amount), selected?.currency)} received. Reference ${data.reference}.`,
      });
      router.refresh();
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the payment service.' });
    } finally {
      setPending(false);
    }
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">Make a payment</CardTitle>
        </CardHeader>
        <CardBody>
          <Alert tone="success">Your account is fully settled. Nothing to pay.</Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Make a payment</CardTitle>
      </CardHeader>
      <CardBody>
        <Field label="Invoice" htmlFor="invoice" required>
          <Select
            id="invoice"
            value={invoiceId}
            onChange={(event) => {
              setInvoiceId(event.target.value);
              const next = invoices.find((i) => i.id === event.target.value);
              if (next) setAmount(String(next.balance));
            }}
          >
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoiceNumber} — {formatCurrency(invoice.balance, invoice.currency)} due
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Amount"
          htmlFor="amount"
          required
          hint={selected ? `Balance: ${formatCurrency(selected.balance, selected.currency)}` : undefined}
        >
          <Input
            id="amount"
            type="number"
            min={1}
            max={selected?.balance}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>

        <Field label="Payment method" htmlFor="provider" required>
          <Select id="provider" value={provider} onChange={(event) => setProvider(event.target.value)}>
            {PROVIDERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Button
          className="w-full"
          onClick={pay}
          disabled={pending || !amount || Number(amount) <= 0}
        >
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
          Pay {amount ? formatCurrency(Number(amount), selected?.currency) : ''}
        </Button>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Payments are processed by the provider you choose. RuMax never stores your card or mobile
          money credentials.
        </p>
      </CardBody>
    </Card>
  );
}
