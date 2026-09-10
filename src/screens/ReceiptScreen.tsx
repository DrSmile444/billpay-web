import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getReceipt } from '../api/client';
import { formatMoney, formatReceiptDate } from '../lib/format';
import type { Receipt } from '../types';

export default function ReceiptScreen() {
  const { id = '' } = useParams();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getReceipt(id)
      .then(setReceipt)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!receipt) return;
    const timer = setTimeout(() => {
      document.title = `Receipt ${receipt.receiptNumber} — ${receipt.recipient.email.toUpperCase()}`;
    }, 0);
    return () => clearTimeout(timer);
  }, [receipt]);

  if (loading) {
    return (
      <div className="row">
        <div className="spinner" /> <span className="muted">Loading receipt…</span>
      </div>
    );
  }
  if (error) return <p className="error">{error}</p>;
  if (!receipt) return null;

  return (
    <div className="stack">
      <div className="app-header">
        <h1>Receipt</h1>
        <span className="badge badge-paid">{receipt.status}</span>
      </div>

      <section className="card stack">
        <h2 className="section-title">Payment confirmation</h2>
        <dl className="kv">
          <dt>Receipt number</dt>
          <dd data-testid="receipt-number">{receipt.receiptNumber}</dd>
          <dt>Recipient</dt>
          <dd>{receipt.recipient.name}</dd>
          <dt>Amount</dt>
          <dd data-testid="receipt-amount">{formatMoney(receipt.amount, receipt.currency)}</dd>
          <dt>Paid on</dt>
          <dd data-testid="receipt-date">{formatReceiptDate(receipt.paidAt)}</dd>
          <dt>Bill id</dt>
          <dd className="muted">{receipt.id}</dd>
        </dl>
      </section>

      <div className="row">
        <Link className="btn btn-primary" to={`/bills/${receipt.id}`}>
          Back to bill
        </Link>
        <Link className="btn" to="/">
          All bills
        </Link>
      </div>
    </div>
  );
}
