import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../mocks/server';
import BillDetail from './BillDetail';
import ReceiptScreen from './ReceiptScreen';

const KYIVENERGO_ID = '9d3f1b22-6c74-4a1f-9c8e-1f2a3b4c5d6e';
const NORTHWIND_ID = '2a7e5c10-88b4-4d2e-a9f1-7c6b5a4d3e2f';
const ACME_ID = '5b1c9d4e-3f2a-4e6b-8a7c-0d1e2f3a4b5c';

function renderBillDetail(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/bills/${id}`]}>
      <Routes>
        <Route path="/bills/:id" element={<BillDetail />} />
        <Route path="/bills/:id/receipt" element={<ReceiptScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BillDetail', () => {
  // The always-500 /history fixture is exactly what
  // docs/bug-payment-history-stuck-loading.md exercises. Every other test
  // below is about something else, so it gets a neutral, successful history
  // response here to avoid being collaterally polluted by that unrelated,
  // separately-tested defect (an unhandled rejection from the missing
  // `.catch` on the history fetch).
  beforeEach(() => {
    server.use(http.get('*/bills/:id/history', () => HttpResponse.json({ entries: [] })));
  });

  it('shows a line item Amount as unit amount times quantity, docs/bug-line-item-amount-not-extended.md', async () => {
    renderBillDetail(KYIVENERGO_ID);
    await screen.findByText('Recipient');

    // "Heating, August": unit amount 1500.00, quantity 2 -> extended 3000.00.
    const row = screen.getByText('Heating, August').closest('tr');
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent('3 000,00');
  });

  it('recipient name renders as text, not markup, docs/bug-xss-recipient-name-stored.md', async () => {
    renderBillDetail(ACME_ID);
    await screen.findByText('Recipient');

    const name = screen.getByTestId('recipient-name');
    expect(name).toHaveTextContent(
      'Acme Cleaning <img src=x onerror="window.__xssFired=(window.__xssFired||0)+1">',
    );
    expect(name.querySelector('img')).toBeNull();
  });

  it('reaches a terminal state for payment history instead of loading forever, docs/bug-payment-history-stuck-loading.md', async () => {
    // Undo this file's default history override: exercise the repo's real,
    // always-500 /history handler from src/mocks/handlers.ts.
    server.resetHandlers();
    renderBillDetail(KYIVENERGO_ID);
    await screen.findByText('Recipient');

    await waitFor(() => expect(screen.queryByText('Loading history…')).not.toBeInTheDocument(), {
      timeout: 1000,
    });
  });

  describe('paying a bill', () => {
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      logSpy.mockRestore();
    });

    it('does not write the recipient email or amount to the console, docs/bug-console-logs-payment-details.md', async () => {
      const user = userEvent.setup();
      renderBillDetail(NORTHWIND_ID);
      await screen.findByText('Recipient');

      await user.click(screen.getByRole('button', { name: /pay/i }));
      await screen.findByTestId('receipt-number');

      const loggedText = logSpy.mock.calls.map((call: unknown[]) => call.join(' ')).join('\n');
      expect(loggedText).not.toContain('ar@northwind.example');
      expect(loggedText).not.toContain('1234.5');
    });

    it('does not throw an uncaught exception, docs/bug-uncaught-typeerror-after-payment.md', async () => {
      const onError = vi.fn();
      window.addEventListener('error', onError);
      const uncaughtHandler = (err: unknown) => onError(err);
      process.on('uncaughtException', uncaughtHandler);

      try {
        const user = userEvent.setup();
        renderBillDetail(NORTHWIND_ID);
        await screen.findByText('Recipient');

        await user.click(screen.getByRole('button', { name: /pay/i }));
        await screen.findByTestId('receipt-number');
        // The receipt screen's buggy effect fires on a 0ms timer.
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(onError).not.toHaveBeenCalled();
      } finally {
        window.removeEventListener('error', onError);
        process.off('uncaughtException', uncaughtHandler);
      }
    });
  });
});
