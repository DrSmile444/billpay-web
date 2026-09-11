import { describe, expect, it } from 'vitest';
import { selectedTotal } from './format';

describe('selectedTotal', () => {
  it('sums a single quantity-1 line item as the bill amount (baseline)', () => {
    const bills = [{ id: 'a', items: [{ amount: 100, quantity: 1 }] }];

    expect(selectedTotal(bills, ['a'])).toBe(100);
  });

  it('uses the bill full amount, not just its first line item, docs/bug-selected-total-uses-first-item.md', () => {
    // Mirrors the seeded "Kyivenergo Utilities" fixture: two line items,
    // 1820.75 (qty 1) + 1500.00 * 2 (qty 2) = 4820.75.
    const bills = [
      {
        id: 'kyivenergo',
        items: [
          { amount: 1820.75, quantity: 1 },
          { amount: 1500.0, quantity: 2 },
        ],
      },
    ];

    expect(selectedTotal(bills, ['kyivenergo'])).toBe(4820.75);
  });
});
