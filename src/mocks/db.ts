import type { Bill } from '../types';

const uuid = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function seed(): Bill[] {
  return [
    {
      id: '9d3f1b22-6c74-4a1f-9c8e-1f2a3b4c5d6e',
      amount: 4820.75,
      currency: 'UAH',
      recipient: {
        id: 'f1c2d3e4-1111-4a2b-8c3d-9e8f7a6b5c40',
        name: 'Kyivenergo Utilities',
        email: 'billing@kyivenergo.example',
      },
      status: 'unpaid',
      createdAt: '2026-08-30T09:12:00.000Z',
      paidAt: null,
      items: [
        { description: 'Electricity, August', amount: 1820.75, quantity: 1 },
        { description: 'Heating, August', amount: 1500.0, quantity: 2 },
      ],
    },
    {
      id: '2a7e5c10-88b4-4d2e-a9f1-7c6b5a4d3e2f',
      amount: 1234.5,
      currency: 'USD',
      recipient: {
        id: 'c9d8e7f6-2222-4b3c-9d4e-8f7a6b5c4d31',
        name: 'Northwind Hosting',
        email: 'ar@northwind.example',
      },
      status: 'unpaid',
      createdAt: '2026-09-01T14:40:00.000Z',
      paidAt: null,
      items: [{ description: 'Dedicated server, Q3', amount: 1234.5, quantity: 1 }],
    },
    {
      id: '5b1c9d4e-3f2a-4e6b-8a7c-0d1e2f3a4b5c',
      amount: 999.9,
      currency: 'UAH',
      recipient: {
        id: 'a1b2c3d4-3333-4c4d-8e5f-7a6b5c4d3e22',
        name: 'Acme Cleaning <img src=x onerror="window.__xssFired=(window.__xssFired||0)+1">',
        email: 'office@acme-cleaning.example',
      },
      status: 'unpaid',
      createdAt: '2026-09-03T08:05:00.000Z',
      paidAt: null,
      items: [{ description: 'Office cleaning, September', amount: 999.9, quantity: 1 }],
    },
    {
      id: '7e4d2c81-5a6b-4f7c-8d9e-1a2b3c4d5e6f',
      amount: 320.0,
      currency: 'UAH',
      recipient: {
        id: 'b4c5d6e7-4444-4d5e-9f60-8a7b6c5d4e33',
        name: 'Dnipro Water Supply',
        email: 'invoices@dniprovoda.example',
      },
      status: 'paid',
      createdAt: '2026-09-09T10:00:00.000Z',
      paidAt: '2026-09-09T21:45:00.000Z',
      items: [{ description: 'Water, August', amount: 320.0, quantity: 1 }],
    },
  ];
}

export const bills: Bill[] = seed();

export const receipts = new Map<string, { receiptNumber: string; issuedAt: string }>([
  [
    '7e4d2c81-5a6b-4f7c-8d9e-1a2b3c4d5e6f',
    { receiptNumber: 'RCPT-2026-000141', issuedAt: '2026-09-09T21:45:00.000Z' },
  ],
]);

export const payIdempotency = new Map<
  string,
  { billId: string; status: number; body: Record<string, unknown> }
>();

export function findBill(id: string): Bill | undefined {
  return bills.find((bill) => bill.id === id);
}

export function newId(): string {
  return uuid();
}
