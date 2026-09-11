import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('bootstrap (src/main.tsx)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('does not keep an access token in localStorage, docs/bug-auth-token-in-localstorage.md', async () => {
    vi.doMock('./mocks/browser', () => ({
      worker: { start: vi.fn().mockResolvedValue(undefined) },
    }));
    vi.doMock('react-dom/client', () => ({
      createRoot: () => ({ render: vi.fn() }),
    }));

    await import('./main');
    // The bootstrap() call is async; let its microtasks settle. The
    // localStorage.setItem under test runs synchronously at module scope,
    // before bootstrap() is even called, so this is just a safety margin.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(localStorage.getItem('billpay.authToken')).toBeNull();
  });
});
