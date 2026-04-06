// tests/tools.test.js — Integration tests for all MCP payment tools.
// Uses Node.js built-in test runner. No HTTP server needed — calls tool handlers directly.

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { MockStablecoinProvider } = require('../providers/mock-stablecoin.js');
const { MockSessionProvider } = require('../providers/mock-session.js');
const { MockFiatProvider } = require('../providers/mock-fiat.js');
const { createAuthMiddleware } = require('../middleware/auth.js');

const checkBalance = require('../tools/check-balance.js');
const listTransactions = require('../tools/list-transactions.js');
const agentInfo = require('../tools/agent-info.js');
const sendPayment = require('../tools/send-payment.js');
const createInvoice = require('../tools/create-invoice.js');
const checkInvoiceStatus = require('../tools/check-invoice-status.js');
const listInvoices = require('../tools/list-invoices.js');
const payInvoice = require('../tools/pay-invoice.js');
const callX402Endpoint = require('../tools/call-x402-endpoint.js');
const createPaymentSession = require('../tools/create-payment-session.js');
const getSessionStatus = require('../tools/get-session-status.js');

// Build a mock router from fresh provider instances.
// Each test that mutates state should use makeRouter() for isolation.
function makeRouter(which = 'all') {
  const providers = {};
  if (which === 'all' || which === 'stablecoin') providers.stablecoin = new MockStablecoinProvider();
  if (which === 'all' || which === 'session')    providers.session    = new MockSessionProvider();
  if (which === 'all' || which === 'fiat')       providers.fiat       = new MockFiatProvider();

  return {
    providers,
    getProvider(preferredType) {
      if (preferredType && providers[preferredType]) return providers[preferredType];
      const types = Object.keys(providers);
      if (types.length === 0) throw new Error('No providers loaded');
      return providers[types[0]];
    },
    requireProvider(type) {
      if (!providers[type]) throw new Error(`Provider '${type}' is not loaded`);
      return providers[type];
    }
  };
}

// ─────────────────────────────────────────────────────────────
// 1. CORE TESTS — check-balance
// ─────────────────────────────────────────────────────────────
describe('check-balance', () => {
  it('returns stablecoin balance for valid agent', () => {
    const router = makeRouter('stablecoin');
    const result = checkBalance.handler({ agentId: 'agent-alice', provider: 'stablecoin' }, router);
    assert.ok(typeof result.total === 'number', 'total should be a number');
    assert.strictEqual(result.currency, 'USDC');
    assert.ok(Array.isArray(result.balances), 'balances should be an array');
  });

  it('throws for unknown agent', () => {
    const router = makeRouter('stablecoin');
    assert.throws(
      () => checkBalance.handler({ agentId: 'agent-nobody', provider: 'stablecoin' }, router),
      /Unknown agent/
    );
  });

  it('returns results from all providers when no provider specified', () => {
    const router = makeRouter('all');
    const result = checkBalance.handler({ agentId: 'agent-alice' }, router);
    assert.ok('stablecoin' in result, 'should include stablecoin result');
    assert.ok('session' in result, 'should include session result');
    assert.ok('fiat' in result, 'should include fiat result');
  });

  it('returns fiat balance for valid agent', () => {
    const router = makeRouter('fiat');
    const result = checkBalance.handler({ agentId: 'agent-alice', provider: 'fiat' }, router);
    assert.ok(Array.isArray(result.balances), 'balances should be an array');
  });
});

// ─────────────────────────────────────────────────────────────
// 2. CORE TESTS — list-transactions
// ─────────────────────────────────────────────────────────────
describe('list-transactions', () => {
  it('returns array of transactions for valid agent', () => {
    const router = makeRouter('stablecoin');
    const result = listTransactions.handler({ agentId: 'agent-alice', provider: 'stablecoin' }, router);
    assert.ok(Array.isArray(result), 'should return an array');
    assert.ok(result.length > 0, 'alice should have seed transactions');
  });

  it('respects limit param', () => {
    const router = makeRouter('stablecoin');
    const result = listTransactions.handler({ agentId: 'agent-alice', provider: 'stablecoin', limit: 1 }, router);
    assert.strictEqual(result.length, 1);
  });

  it('respects offset param', () => {
    const router = makeRouter('stablecoin');
    const all = listTransactions.handler({ agentId: 'agent-alice', provider: 'stablecoin' }, router);
    const paged = listTransactions.handler({ agentId: 'agent-alice', provider: 'stablecoin', offset: 1 }, router);
    assert.strictEqual(paged.length, all.length - 1);
  });

  it('throws for unknown agent', () => {
    const router = makeRouter('stablecoin');
    assert.throws(
      () => listTransactions.handler({ agentId: 'agent-nobody', provider: 'stablecoin' }, router),
      /Unknown agent/
    );
  });
});

// ─────────────────────────────────────────────────────────────
// 3. CORE TESTS — agent-info
// ─────────────────────────────────────────────────────────────
describe('agent-info', () => {
  it('returns agent info for valid agent (stablecoin)', () => {
    const router = makeRouter('stablecoin');
    const result = agentInfo.handler({ agentId: 'agent-alice', provider: 'stablecoin' }, router);
    assert.strictEqual(result.id, 'agent-alice');
    assert.strictEqual(result.name, 'Alice Trading Agent');
    assert.ok(Array.isArray(result.supportedChains));
  });

  it('returns info from all providers when no provider specified', () => {
    const router = makeRouter('all');
    const result = agentInfo.handler({ agentId: 'agent-bob' }, router);
    assert.ok('stablecoin' in result && 'session' in result && 'fiat' in result);
  });

  it('returns error shape for unknown agent across all providers', () => {
    const router = makeRouter('all');
    const result = agentInfo.handler({ agentId: 'agent-nobody' }, router);
    // Every provider should have an error key for an unknown agent
    for (const val of Object.values(result)) {
      assert.ok(typeof val.error === 'string', 'each provider should report an error');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// 4. CORE TESTS — send-payment
// ─────────────────────────────────────────────────────────────
describe('send-payment', () => {
  it('deducts balance after valid stablecoin payment', () => {
    const router = makeRouter('stablecoin');
    const before = router.providers.stablecoin.getBalance('agent-alice', { chain: 'polygon' }).amount;
    sendPayment.handler({ from: 'agent-alice', to: 'agent-bob', amount: 5, chain: 'polygon' }, router);
    const after = router.providers.stablecoin.getBalance('agent-alice', { chain: 'polygon' }).amount;
    assert.strictEqual(after, before - 5);
  });

  it('throws when stablecoin balance is insufficient', () => {
    const router = makeRouter('stablecoin');
    assert.throws(
      () => sendPayment.handler({ from: 'agent-charlie', to: 'agent-bob', amount: 9999, chain: 'base' }, router),
      /Insufficient balance/
    );
  });

  it('returns txId and confirmed status for stablecoin payment', () => {
    const router = makeRouter('stablecoin');
    const result = sendPayment.handler({ from: 'agent-alice', to: 'agent-bob', amount: 1, chain: 'polygon' }, router);
    assert.ok(result.txId, 'should return txId');
    assert.strictEqual(result.status, 'confirmed');
  });

  it('deducts balance after valid fiat payment (card)', () => {
    const router = makeRouter('fiat');
    const before = router.providers.fiat.getBalance('agent-alice', { currency: 'USD' }).amount;
    sendPayment.handler({ from: 'agent-alice', to: 'agent-bob', amount: 10, currency: 'USD', paymentMethod: 'card' }, router);
    const after = router.providers.fiat.getBalance('agent-alice', { currency: 'USD' }).amount;
    assert.strictEqual(after, before - 10);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. CORE TESTS — create-invoice
// ─────────────────────────────────────────────────────────────
describe('create-invoice', () => {
  it('creates invoice with valid params', () => {
    const router = makeRouter('stablecoin');
    const result = createInvoice.handler(
      { createdBy: 'agent-alice', billedTo: 'agent-bob', amount: 20, currency: 'USDC', description: 'Test invoice', provider: 'stablecoin' },
      router
    );
    assert.ok(result.invoiceId, 'should return invoiceId');
    assert.strictEqual(result.status, 'draft');
    assert.strictEqual(result.amount, 20);
  });

  it('throws when required params are missing', () => {
    const router = makeRouter('stablecoin');
    assert.throws(
      () => createInvoice.handler({ createdBy: 'agent-alice', provider: 'stablecoin' }, router),
      /Required/
    );
  });

  it('throws when amount is negative', () => {
    const router = makeRouter('stablecoin');
    assert.throws(
      () => createInvoice.handler({ createdBy: 'agent-alice', billedTo: 'agent-bob', amount: -5, currency: 'USDC', provider: 'stablecoin' }, router),
      /positive/
    );
  });
});

// ─────────────────────────────────────────────────────────────
// 6. CORE TESTS — check-invoice-status
// ─────────────────────────────────────────────────────────────
describe('check-invoice-status', () => {
  it('returns invoice for seed invoice inv-001', () => {
    const router = makeRouter('stablecoin');
    const result = checkInvoiceStatus.handler({ invoiceId: 'inv-001', provider: 'stablecoin' }, router);
    assert.strictEqual(result.invoiceId, 'inv-001');
    assert.ok(result.status, 'should have a status');
  });

  it('throws for unknown invoice ID', () => {
    const router = makeRouter('stablecoin');
    assert.throws(
      () => checkInvoiceStatus.handler({ invoiceId: 'inv-9999', provider: 'stablecoin' }, router),
      /Invoice not found/
    );
  });

  it('finds invoice across all providers when no provider specified', () => {
    const router = makeRouter('all');
    const result = checkInvoiceStatus.handler({ invoiceId: 'inv-001' }, router);
    assert.strictEqual(result.invoiceId, 'inv-001');
  });
});

// ─────────────────────────────────────────────────────────────
// 7. CORE TESTS — list-invoices
// ─────────────────────────────────────────────────────────────
describe('list-invoices', () => {
  it("returns agent bob's invoices", () => {
    const router = makeRouter('stablecoin');
    const result = listInvoices.handler({ agentId: 'agent-bob', provider: 'stablecoin' }, router);
    assert.ok(Array.isArray(result), 'should be an array');
    assert.ok(result.length > 0, 'bob should have seeded invoices');
  });

  it('filters invoices by status', () => {
    const router = makeRouter('stablecoin');
    const result = listInvoices.handler({ agentId: 'agent-bob', status: 'sent', provider: 'stablecoin' }, router);
    for (const inv of result) {
      assert.strictEqual(inv.status, 'sent');
    }
  });

  it('returns empty array for agent with no matching invoices', () => {
    const router = makeRouter('stablecoin');
    // charlie has one invoice (inv-002, status overdue) — filtering for 'paid' should give empty
    const result = listInvoices.handler({ agentId: 'agent-charlie', status: 'paid', provider: 'stablecoin' }, router);
    assert.strictEqual(result.length, 0);
  });
});

// ─────────────────────────────────────────────────────────────
// 8. CORE TESTS — pay-invoice
// ─────────────────────────────────────────────────────────────
describe('pay-invoice', () => {
  it('pays invoice successfully via stablecoin', () => {
    const router = makeRouter('stablecoin');
    // inv-001: agent-alice owes agent-bob 25 USDC; alice has 100 on polygon
    const result = payInvoice.handler(
      { invoiceId: 'inv-001', agentId: 'agent-alice', provider: 'stablecoin', chain: 'polygon' },
      router
    );
    assert.strictEqual(result.status, 'paid');
    assert.strictEqual(result.invoiceId, 'inv-001');
    assert.ok(result.txId);
  });

  it('throws when trying to pay an already-paid invoice', () => {
    const router = makeRouter('stablecoin');
    // Pay it once
    payInvoice.handler(
      { invoiceId: 'inv-001', agentId: 'agent-alice', provider: 'stablecoin', chain: 'polygon' },
      router
    );
    // Pay it again — should throw
    assert.throws(
      () => payInvoice.handler(
        { invoiceId: 'inv-001', agentId: 'agent-alice', provider: 'stablecoin', chain: 'polygon' },
        router
      ),
      /already paid/
    );
  });

  it('throws for unknown invoice', () => {
    const router = makeRouter('stablecoin');
    assert.throws(
      () => payInvoice.handler({ invoiceId: 'inv-9999', agentId: 'agent-alice', provider: 'stablecoin' }, router),
      /not found/
    );
  });
});

// ─────────────────────────────────────────────────────────────
// 9. STABLECOIN-SPECIFIC — check-balance with chain filter
// ─────────────────────────────────────────────────────────────
describe('stablecoin — check-balance with chain filter', () => {
  it('returns single-chain balance when chain is specified', () => {
    const router = makeRouter('stablecoin');
    const result = checkBalance.handler({ agentId: 'agent-alice', provider: 'stablecoin', chain: 'polygon' }, router);
    assert.strictEqual(result.chain, 'polygon');
    assert.strictEqual(result.amount, 100);
  });

  it('throws for unsupported chain', () => {
    const router = makeRouter('stablecoin');
    assert.throws(
      () => checkBalance.handler({ agentId: 'agent-alice', provider: 'stablecoin', chain: 'solana' }, router),
      /Unsupported chain/
    );
  });
});

// ─────────────────────────────────────────────────────────────
// 10. STABLECOIN-SPECIFIC — send-payment with chain
// ─────────────────────────────────────────────────────────────
describe('stablecoin — send-payment chain handling', () => {
  it('throws when chain is not supported', () => {
    const router = makeRouter('stablecoin');
    assert.throws(
      () => sendPayment.handler({ from: 'agent-alice', to: 'agent-bob', amount: 1, chain: 'solana' }, router),
      /Unsupported chain/
    );
  });

  it('succeeds on base chain', () => {
    const router = makeRouter('stablecoin');
    const result = sendPayment.handler({ from: 'agent-alice', to: 'agent-bob', amount: 1, chain: 'base' }, router);
    assert.strictEqual(result.chain, 'base');
    assert.strictEqual(result.status, 'confirmed');
  });
});

// ─────────────────────────────────────────────────────────────
// 11. STABLECOIN-SPECIFIC — call-x402-endpoint
// ─────────────────────────────────────────────────────────────
describe('stablecoin — call-x402-endpoint', () => {
  it('returns mock data after paying x402 endpoint', () => {
    const router = makeRouter('stablecoin');
    // Alice has 50 USDC on base — more than enough for a tiny x402 call
    const result = callX402Endpoint.handler(
      { url: 'https://api.example.com/data', agentId: 'agent-alice', chain: 'base' },
      router
    );
    assert.strictEqual(result.status, 200);
    assert.ok(result.x402, 'should have x402 payment details');
    assert.ok(result.data, 'should have response data');
  });

  it('throws when agent has insufficient balance for x402', () => {
    const router = makeRouter('stablecoin');
    // Drain charlie's base balance first (charlie only has 10 USDC on base)
    router.providers.stablecoin.balances['agent-charlie']['base'].amount = 0;
    assert.throws(
      () => callX402Endpoint.handler(
        { url: 'https://api.example.com/data', agentId: 'agent-charlie', chain: 'base' },
        router
      ),
      /Insufficient balance/
    );
  });

  it('throws when provider is not stablecoin', () => {
    const router = makeRouter('fiat'); // no stablecoin
    assert.throws(
      () => callX402Endpoint.handler({ url: 'https://api.example.com/data', agentId: 'agent-alice' }, router),
      /not loaded/
    );
  });
});

// ─────────────────────────────────────────────────────────────
// 12. SESSION-SPECIFIC — create-payment-session
// ─────────────────────────────────────────────────────────────
describe('session — create-payment-session', () => {
  it('creates session successfully with sufficient balance', () => {
    const router = makeRouter('session');
    const result = createPaymentSession.handler(
      { agentId: 'agent-alice', budget: 10, currency: 'USD', description: 'Test session' },
      router
    );
    assert.ok(result.sessionId, 'should return sessionId');
    assert.strictEqual(result.status, 'active');
    assert.strictEqual(result.budget, 10);
    assert.strictEqual(result.remaining, 10);
  });

  it('throws when agent has insufficient balance to back session', () => {
    const router = makeRouter('session');
    assert.throws(
      () => createPaymentSession.handler({ agentId: 'agent-charlie', budget: 9999, currency: 'USD' }, router),
      /Insufficient balance/
    );
  });

  it('throws when budget is negative', () => {
    const router = makeRouter('session');
    assert.throws(
      () => createPaymentSession.handler({ agentId: 'agent-alice', budget: -10, currency: 'USD' }, router),
      /positive/
    );
  });
});

// ─────────────────────────────────────────────────────────────
// 13. SESSION-SPECIFIC — get-session-status
// ─────────────────────────────────────────────────────────────
describe('session — get-session-status', () => {
  it('returns status for seed session session-001', () => {
    const router = makeRouter('session');
    const result = getSessionStatus.handler({ sessionId: 'session-001' }, router);
    assert.strictEqual(result.sessionId, 'session-001');
    assert.ok(typeof result.budget === 'number');
    assert.ok(typeof result.remaining === 'number');
    assert.ok(typeof result.spent === 'number');
  });

  it('throws for unknown session', () => {
    const router = makeRouter('session');
    assert.throws(
      () => getSessionStatus.handler({ sessionId: 'session-9999' }, router),
      /Session not found/
    );
  });

  it('throws when session provider not loaded', () => {
    const router = makeRouter('fiat'); // no session provider
    assert.throws(
      () => getSessionStatus.handler({ sessionId: 'session-001' }, router),
      /not loaded/
    );
  });
});

// ─────────────────────────────────────────────────────────────
// 14. SESSION-SPECIFIC — send-payment within session
// ─────────────────────────────────────────────────────────────
describe('session — send-payment within session', () => {
  it('deducts from session remaining after payment within session', () => {
    const router = makeRouter('session');
    // Create a fresh session first
    const { sessionId } = createPaymentSession.handler(
      { agentId: 'agent-alice', budget: 5, currency: 'USD' },
      router
    );
    const before = router.providers.session.getSessionStatus(sessionId).remaining;
    sendPayment.handler({ from: 'agent-alice', to: 'some-service', amount: 1, currency: 'USD', sessionId }, router);
    const after = router.providers.session.getSessionStatus(sessionId).remaining;
    assert.strictEqual(after, before - 1);
  });

  it('throws when payment exceeds session budget', () => {
    const router = makeRouter('session');
    const { sessionId } = createPaymentSession.handler(
      { agentId: 'agent-alice', budget: 2, currency: 'USD' },
      router
    );
    assert.throws(
      () => sendPayment.handler({ from: 'agent-alice', to: 'some-service', amount: 5, currency: 'USD', sessionId }, router),
      /Exceeds session budget/
    );
  });
});

// ─────────────────────────────────────────────────────────────
// 15. FIAT-SPECIFIC — send-payment with various methods
// ─────────────────────────────────────────────────────────────
describe('fiat — send-payment payment methods', () => {
  it('processes card payment and returns authorized status', () => {
    const router = makeRouter('fiat');
    const result = sendPayment.handler(
      { from: 'agent-alice', to: 'agent-bob', amount: 10, currency: 'USD', paymentMethod: 'card' },
      router
    );
    assert.strictEqual(result.paymentMethod, 'card');
    assert.strictEqual(result.status, 'authorized');
  });

  it('processes bank_transfer and returns processing status', () => {
    const router = makeRouter('fiat');
    const result = sendPayment.handler(
      { from: 'agent-alice', to: 'agent-bob', amount: 10, currency: 'USD', paymentMethod: 'bank_transfer' },
      router
    );
    assert.strictEqual(result.paymentMethod, 'bank_transfer');
    assert.strictEqual(result.status, 'processing');
  });

  it('throws when UPI is used as payment method', () => {
    const router = makeRouter('fiat');
    assert.throws(
      () => sendPayment.handler(
        { from: 'agent-alice', to: 'agent-bob', amount: 10, currency: 'USD', paymentMethod: 'upi' },
        router
      ),
      /UPI is not supported/
    );
  });

  it('converts currency correctly USD to INR', () => {
    const provider = new MockFiatProvider();
    const inr = provider.convertCurrency(1, 'USD', 'INR');
    // Rate is 83.5
    assert.strictEqual(inr, 83.5);
  });

  it('throws for unsupported currency', () => {
    const router = makeRouter('fiat');
    assert.throws(
      () => sendPayment.handler(
        { from: 'agent-alice', to: 'agent-bob', amount: 5, currency: 'EUR', paymentMethod: 'card' },
        router
      ),
      /Unsupported currency/
    );
  });
});

// ─────────────────────────────────────────────────────────────
// 16. AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────
describe('auth middleware', () => {
  it('allows everything when auth is disabled', () => {
    const auth = createAuthMiddleware(false);
    const result = auth({ headers: {} });
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.agentId, null);
  });

  it('returns agentId for valid bearer token', () => {
    const auth = createAuthMiddleware(true);
    const result = auth({ headers: { authorization: 'Bearer test-token-alice' } });
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.agentId, 'agent-alice');
  });

  it('rejects an invalid token', () => {
    const auth = createAuthMiddleware(true);
    const result = auth({ headers: { authorization: 'Bearer wrong-token' } });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.reason, 'should explain why it was rejected');
  });

  it('rejects when Authorization header is absent', () => {
    const auth = createAuthMiddleware(true);
    const result = auth({ headers: {} });
    assert.strictEqual(result.allowed, false);
    assert.match(result.reason, /Missing Authorization/);
  });

  it('rejects malformed Authorization header (no Bearer prefix)', () => {
    const auth = createAuthMiddleware(true);
    const result = auth({ headers: { authorization: 'test-token-alice' } });
    assert.strictEqual(result.allowed, false);
  });

  it('resolves correct agentId for bob token', () => {
    const auth = createAuthMiddleware(true);
    const result = auth({ headers: { authorization: 'Bearer test-token-bob' } });
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.agentId, 'agent-bob');
  });
});
