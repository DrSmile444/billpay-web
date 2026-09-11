import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../mocks/server';
import NewBill from './NewBill';

function renderNewBill() {
  return render(
    <MemoryRouter>
      <NewBill />
    </MemoryRouter>,
  );
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, values: {
  name?: string;
  email?: string;
  amount?: string;
}) {
  if (values.name !== undefined) {
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), values.name);
  }
  if (values.email !== undefined) {
    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), values.email);
  }
  if (values.amount !== undefined) {
    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), values.amount);
  }
  await user.click(screen.getByRole('button', { name: /create bill/i }));
}

describe('NewBill', () => {
  it('rejects a syntactically invalid email, docs/bug-new-bill-email-not-validated.md', async () => {
    const user = userEvent.setup();
    const postSpy = vi.fn();
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') postSpy(request.url);
    });

    renderNewBill();
    await fillAndSubmit(user, { name: 'Test Recipient', email: 'not-an-email', amount: '100' });

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('rejects an amount with more precision than the currency allows, docs/bug-amount-precision-display-mismatch.md', async () => {
    // Interpretation recorded in design.md: reject sub-unit precision at
    // entry (e.g. 0.005 for UAH, which only has two decimal places).
    const user = userEvent.setup();
    const postSpy = vi.fn();
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') postSpy(request.url);
    });

    renderNewBill();
    await fillAndSubmit(user, {
      name: 'Fraction Test',
      email: 'a@b.com',
      amount: '0.005',
    });

    expect(await screen.findByText(/amount/i, { selector: '.error' })).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });
});
