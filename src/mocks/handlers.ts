import { http, HttpResponse, delay } from 'msw';
import type { Bill, CreateBillPayload } from '../types';
import { bills, findBill, newId, payIdempotency, receipts } from './db';

const base = `${import.meta.env.BASE_URL}api`;

function toBillResponse(bill: Bill) {
  return {
    id: bill.id,
    amount: bill.amount,
    currency: bill.currency,
    recipient: bill.recipient,
    status: bill.status,
    createdAt: bill.createdAt,
    paidAt: bill.paidAt,
    items: bill.items,
  };
}

export const handlers = [
  http.get(`${base}/bills`, async () => {
    await delay(120);
    return HttpResponse.json(bills.map(toBillResponse));
  }),

  http.post(`${base}/bills`, async ({ request }) => {
    const payload = (await request.json()) as CreateBillPayload;
    await delay(150);
    const bill: Bill = {
      id: newId(),
      amount: payload.amount,
      currency: payload.currency,
      recipient: {
        id: newId(),
        name: payload.recipient.name,
        email: payload.recipient.email,
      },
      status: 'unpaid',
      createdAt: new Date().toISOString(),
      paidAt: null,
      items: [{ description: payload.recipient.name, amount: payload.amount, quantity: 1 }],
    };
    bills.push(bill);
    return HttpResponse.json(toBillResponse(bill), { status: 201 });
  }),

  http.get(`${base}/bills/:id`, async ({ params }) => {
    await delay(100);
    const bill = findBill(String(params.id));
    if (!bill) {
      return HttpResponse.json({ message: 'Bill not found' }, { status: 404 });
    }
    return HttpResponse.json(toBillResponse(bill));
  }),

  http.get(`${base}/bills/:id/history`, async () => {
    await delay(200);
    return HttpResponse.json(
      { statusCode: 500, message: 'Internal server error' },
      { status: 500 },
    );
  }),

  http.post(`${base}/bills/:id/pay`, async ({ params, request }) => {
    const id = String(params.id);
    const key = request.headers.get('idempotency-key') ?? undefined;
    await delay(400);

    if (key) {
      const record = payIdempotency.get(key);
      if (record) {
        if (record.billId !== id) {
          return HttpResponse.json(
            { statusCode: 409, message: 'Idempotency-Key already used for a different bill' },
            { status: 409 },
          );
        }
        return HttpResponse.json(record.body, { status: record.status });
      }
    }

    const bill = findBill(id);
    if (!bill) {
      const body = { statusCode: 404, message: `Bill with id ${id} not found` };
      if (key) payIdempotency.set(key, { billId: id, status: 404, body });
      return HttpResponse.json(body, { status: 404 });
    }
    if (bill.status === 'paid') {
      const body = { statusCode: 409, message: 'Bill is already paid' };
      if (key) payIdempotency.set(key, { billId: id, status: 409, body });
      return HttpResponse.json(body, { status: 409 });
    }

    const paidAt = new Date().toISOString();
    bill.status = 'paid';
    bill.paidAt = paidAt;
    receipts.set(bill.id, {
      receiptNumber: `RCPT-2026-${String(receipts.size + 142).padStart(6, '0')}`,
      issuedAt: paidAt,
    });

    const body = toBillResponse(bill);
    if (key) payIdempotency.set(key, { billId: id, status: 200, body });
    return HttpResponse.json(body, { status: 200 });
  }),

  http.get(`${base}/bills/:id/receipt`, async ({ params }) => {
    await delay(150);
    const bill = findBill(String(params.id));
    if (!bill) {
      return HttpResponse.json({ message: 'Bill not found' }, { status: 404 });
    }
    if (bill.status !== 'paid') {
      return HttpResponse.json(
        { statusCode: 409, message: 'Bill is not paid yet' },
        { status: 409 },
      );
    }
    const receipt = receipts.get(bill.id)!;
    return HttpResponse.json({
      id: bill.id,
      amount: bill.amount,
      currency: bill.currency,
      recipient: { id: bill.recipient.id, name: bill.recipient.name },
      status: bill.status,
      createdAt: bill.createdAt,
      paidAt: bill.paidAt,
      receiptNumber: receipt.receiptNumber,
      issuedAt: receipt.issuedAt,
    });
  }),
];
