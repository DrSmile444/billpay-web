import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listBills } from '../api/client';
import { formatDateTime, formatMoney, selectedTotal } from '../lib/format';
import type { Bill } from '../types';

export default function BillsList() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listBills()
      .then((data) => setBills(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const total = selectedTotal(bills, selected);
  const totalCurrency = bills.find((bill) => bill.id === selected[0])?.currency ?? 'UAH';

  return (
    <div className="stack">
      <div className="app-header">
        <h1>Bills</h1>
        <div className="row">
          <button className="icon-btn" onClick={load} data-testid="refresh">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path
                d="M13.5 8a5.5 5.5 0 1 1-1.61-3.89M13.5 2v3h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <Link className="btn" to="/bills/new">
            New bill
          </Link>
        </div>
      </div>

      {loading && (
        <div className="row">
          <div className="spinner" /> <span className="muted">Loading bills…</span>
        </div>
      )}
      {error && <p className="error">{error}</p>}

      <ul className="bill-list">
        {bills.map((bill) => (
          <li key={bill.id}>
            <input
              type="checkbox"
              checked={selected.includes(bill.id)}
              onChange={() => toggle(bill.id)}
              aria-label={`Select bill for ${bill.recipient.email}`}
            />
            <div className="bill-main">
              <Link to={`/bills/${bill.id}`}>{bill.recipient.name}</Link>
              <div className="muted">
                {bill.recipient.email} · created {formatDateTime(bill.createdAt)}
              </div>
            </div>
            <span className={`badge ${bill.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
              {bill.status}
            </span>
            <strong data-testid={`amount-${bill.id}`}>
              {formatMoney(bill.amount, bill.currency)}
            </strong>
          </li>
        ))}
      </ul>

      <div className="total-bar">
        <span>Selected: {selected.length}</span>
        <span data-testid="selected-total">{formatMoney(total, totalCurrency)}</span>
      </div>
    </div>
  );
}
