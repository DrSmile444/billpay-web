export type Currency = 'UAH' | 'USD';
export type BillStatus = 'unpaid' | 'paid';

export interface Recipient {
  id: string;
  name: string;
  email: string;
}

export interface BillItem {
  description: string;
  amount: number;
  quantity: number;
}

export interface Bill {
  id: string;
  amount: number;
  currency: Currency;
  recipient: Recipient;
  status: BillStatus;
  createdAt: string;
  paidAt: string | null;
  items: BillItem[];
}

export interface Receipt {
  id: string;
  amount: number;
  currency: Currency;
  recipient: Recipient;
  status: BillStatus;
  createdAt: string;
  paidAt: string;
  receiptNumber: string;
  issuedAt: string;
}

export interface CreateBillPayload {
  amount: number;
  currency: Currency;
  recipient: { name: string; email: string };
}
