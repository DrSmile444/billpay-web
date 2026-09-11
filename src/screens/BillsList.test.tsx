import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import BillsList from './BillsList';

function renderBillsList() {
  return render(
    <MemoryRouter>
      <BillsList />
    </MemoryRouter>,
  );
}

describe('BillsList', () => {
  it('has an accessible name on the refresh control, docs/bug-refresh-button-no-accessible-name.md', async () => {
    renderBillsList();
    await screen.findByText('Kyivenergo Utilities');

    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('sums the full bill amount for a selected multi-line-item bill, docs/bug-selected-total-uses-first-item.md', async () => {
    const user = userEvent.setup();
    renderBillsList();
    await screen.findByText('Kyivenergo Utilities');

    // Kyivenergo Utilities: 1820.75 (qty 1) + 1500.00 * 2 (qty 2) = 4820.75.
    await user.click(screen.getByRole('checkbox', { name: 'Select bill for billing@kyivenergo.example' }));

    expect(screen.getByTestId('selected-total')).toHaveTextContent('4 820,75');
  });

  it('shows a separate total per currency instead of combining them, docs/bug-selected-total-mixes-currencies.md', async () => {
    // Interpretation recorded in design.md: a separate total is shown per
    // currency present among the selected bills, via one
    // data-testid="selected-total-<CURRENCY>" element per currency.
    const user = userEvent.setup();
    renderBillsList();
    await screen.findByText('Kyivenergo Utilities');

    await user.click(screen.getByRole('checkbox', { name: 'Select bill for billing@kyivenergo.example' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select bill for ar@northwind.example' }));

    expect(screen.getByTestId('selected-total-UAH')).toHaveTextContent('4 820,75');
    expect(screen.getByTestId('selected-total-USD')).toHaveTextContent('1,234.50');
  });
});
