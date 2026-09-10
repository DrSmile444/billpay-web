import type { Currency } from '../types';

const LOCALES: Record<Currency, string> = {
  UAH: 'uk-UA',
  USD: 'en-US',
};

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(LOCALES[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function formatReceiptDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function selectedTotal(
  bills: { id: string; items: { amount: number; quantity: number }[] }[],
  selected: string[],
): number {
  return selected.reduce((sum, id) => {
    const bill = bills.find((candidate) => candidate.id === id);
    if (!bill) return sum;
    const line = bill.items[0];
    return sum + line.amount * line.quantity;
  }, 0);
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Email is required';
  if (value.length < 3) return 'Email is too short';
  return null;
}
