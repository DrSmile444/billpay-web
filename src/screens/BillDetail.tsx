import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBill, getBillHistory, payBill } from '../api/client';
import { formatDateTime, formatMoney } from '../lib/format';
import type { Bill } from '../types';

export default function BillDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBill(id)
      .then(setBill)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setHistoryLoading(true);
    getBillHistory(id).then((data) => {
      setHistory(data.entries);
      setHistoryLoading(false);
    });
  }, [id]);

  const handlePay = useCallback(async () => {
    if (!bill) return;
    console.log('[billpay] submitting payment', bill.recipient.email, bill.amount, bill.currency);
    setPayError(null);
    try {
      const updated = await payBill(bill.id, bill.amount, bill.currency, crypto.randomUUID());
      setBill(updated);
      navigate(`/bills/${bill.id}/receipt`);
    } catch (err) {
      setPayError((err as Error).message);
    }
  }, [bill, navigate]);

  if (loading) {
    return (
      <div className="row">
        <div className="spinner" /> <span className="muted">Loading bill…</span>
      </div>
    );
  }
  if (error) return <p className="error">{error}</p>;
  if (!bill) return null;

  return (
    <div className="stack">
      <div className="app-header">
        <h1>Bill</h1>
        <span className={`badge ${bill.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
          {bill.status}
        </span>
      </div>

      <section className="card stack">
        <h2 className="section-title">Recipient</h2>
        <dl className="kv">
          <dt>Name</dt>
          <dd data-testid="recipient-name">{bill.recipient.name}</dd>
          <dt>Email</dt>
          <dd>{bill.recipient.email}</dd>
          <dt>Recipient id</dt>
          <dd className="muted">{bill.recipient.id}</dd>
        </dl>
      </section>

      <section className="card stack">
        <h2 className="section-title">Line items</h2>
        <table className="items">
          <thead>
            <tr>
              <th>Description</th>
              <th className="num">Qty</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item) => (
              <tr key={item.description}>
                <td>{item.description}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">{formatMoney(item.amount, bill.currency)}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td className="num" />
              <td className="num">
                <strong data-testid="bill-total">{formatMoney(bill.amount, bill.currency)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="muted">Created {formatDateTime(bill.createdAt)}</p>
      </section>

      <section className="card stack">
        <h2 className="section-title--history">Payment history</h2>
        {historyLoading && (
          <div className="row" data-testid="history-spinner">
            <div className="spinner" /> <span className="muted">Loading history…</span>
          </div>
        )}
        {history && history.length === 0 && <p className="muted">No events yet.</p>}
        {history?.map((entry) => (
          <p key={entry} className="muted">
            {entry}
          </p>
        ))}
      </section>

      {payError && <p className="error">{payError}</p>}

      <div className="row">
        {bill.status === 'unpaid' ? (
          <button className="btn btn-primary btn-pay" onClick={handlePay}>
            Pay {formatMoney(bill.amount, bill.currency)}
          </button>
        ) : (
          <Link className="btn btn-primary btn-pay" to={`/bills/${bill.id}/receipt`}>
            View receipt
          </Link>
        )}
        <Link className="btn" to="/">
          Back to bills
        </Link>
      </div>
    </div>
  );
}
