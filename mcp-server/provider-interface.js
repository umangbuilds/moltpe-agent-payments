// provider-interface.js — PaymentProvider contract
// Documents the interface every provider must implement.
// JavaScript has no interfaces, so this serves as documentation and validation.

/**
 * PaymentProvider interface.
 *
 * Every provider must implement:
 *
 * CORE (required for all providers):
 *   getBalance(agentId, options?)         → { balance, currency, chain? }
 *   getTransactions(agentId, options?)     → [{ id, type, amount, currency, status, timestamp, ... }]
 *   getAgentInfo(agentId)                 → { id, name, status, created, wallets? }
 *   sendPayment(params)                   → { txId, status, amount, currency, ... }
 *   createInvoice(params)                 → { invoiceId, status, amount, currency, ... }
 *   getInvoiceStatus(invoiceId)           → { invoiceId, status, amount, paid, ... }
 *   listInvoices(agentId, options?)       → [invoices]
 *   payInvoice(invoiceId, params)         → { txId, status, ... }
 *
 * STABLECOIN-ONLY (x402):
 *   callX402Endpoint(url, params)         → { status, data, cost, ... }
 *
 * SESSION-ONLY (MPP):
 *   createSession(params)                 → { sessionId, budget, remaining, expiry, ... }
 *   getSessionStatus(sessionId)           → { sessionId, budget, spent, remaining, payments, expiry }
 *   payWithinSession(sessionId, params)   → { txId, status, amount, remaining }
 *   closeSession(sessionId)               → { summary }
 */

const REQUIRED_METHODS = [
  'getBalance',
  'getTransactions',
  'getAgentInfo',
  'sendPayment',
  'createInvoice',
  'getInvoiceStatus',
  'listInvoices',
  'payInvoice'
];

const STABLECOIN_METHODS = ['callX402Endpoint'];
const SESSION_METHODS = ['createSession', 'getSessionStatus', 'payWithinSession', 'closeSession'];

function validateProvider(provider, type) {
  const missing = REQUIRED_METHODS.filter(m => typeof provider[m] !== 'function');
  if (missing.length > 0) {
    throw new Error(`Provider missing required methods: ${missing.join(', ')}`);
  }

  if (type === 'stablecoin') {
    const missingStablecoin = STABLECOIN_METHODS.filter(m => typeof provider[m] !== 'function');
    if (missingStablecoin.length > 0) {
      throw new Error(`Stablecoin provider missing methods: ${missingStablecoin.join(', ')}`);
    }
  }

  if (type === 'session') {
    const missingSession = SESSION_METHODS.filter(m => typeof provider[m] !== 'function');
    if (missingSession.length > 0) {
      throw new Error(`Session provider missing methods: ${missingSession.join(', ')}`);
    }
  }

  return true;
}

module.exports = { validateProvider, REQUIRED_METHODS, STABLECOIN_METHODS, SESSION_METHODS };
