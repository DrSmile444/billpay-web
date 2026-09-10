import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createBill } from '../api/client';
import { validateEmail } from '../lib/format';
import type { Currency } from '../types';

export default function NewBill() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('100.00');
  const [currency, setCurrency] = useState<Currency>('UAH');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Recipient name is required';
    const emailError = validateEmail(email);
    if (emailError) next.email = emailError;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) next.amount = 'Amount must be greater than zero';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const bill = await createBill({
        amount: parsed,
        currency,
        recipient: { name: name.trim(), email: email.trim() },
      });
      navigate(`/bills/${bill.id}`);
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      <div className="app-header">
        <h1>New bill</h1>
      </div>

      <section className="card stack">
        <h2 className="section-title">Recipient</h2>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
      </section>

      <section className="card stack">
        <h2 className="section-title">Amount</h2>
        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          {errors.amount && <span className="error">{errors.amount}</span>}
        </div>
        <div className="field">
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            <option value="UAH">UAH</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </section>

      {errors.form && <p className="error">{errors.form}</p>}

      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          Create bill
        </button>
        <Link className="btn" to="/">
          Cancel
        </Link>
      </div>
    </form>
  );
}
