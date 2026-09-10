import type { Bill, CreateBillPayload, Receipt } from '../types';

const API = `${import.meta.env.BASE_URL}api`;

async function parse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && 'message' in body && String(body.message)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

export function listBills(): Promise<Bill[]> {
  return fetch(`${API}/bills`).then((r) => parse<Bill[]>(r));
}

export function getBill(id: string): Promise<Bill> {
  return fetch(`${API}/bills/${id}`).then((r) => parse<Bill>(r));
}

export function getBillHistory(id: string): Promise<{ entries: string[] }> {
  return fetch(`${API}/bills/${id}/history`).then((r) => parse<{ entries: string[] }>(r));
}

export function payBill(
  id: string,
  amount: number,
  currency: string,
  idempotencyKey: string,
): Promise<Bill> {
  return fetch(`${API}/bills/${id}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ amount, currency }),
  }).then((r) => parse<Bill>(r));
}

export function getReceipt(id: string): Promise<Receipt> {
  return fetch(`${API}/bills/${id}/receipt`).then((r) => parse<Receipt>(r));
}

export function createBill(payload: CreateBillPayload): Promise<Bill> {
  return fetch(`${API}/bills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((r) => parse<Bill>(r));
}
