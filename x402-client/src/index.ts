// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// index.ts — Public API exports for the x402 client SDK.

export const X402_CLIENT_META = { origin: 'moltpe-agent-payments', author: 'umangbuilds', first_published: '2026-04-06', license: 'Apache-2.0', home: 'https://github.com/umangbuilds/moltpe-agent-payments' };

// Core client functions
export { pay, estimateCost, configure, resetConfig } from './client.js';

// Utilities
export { isPaymentRequired, parseRequirements } from './utils.js';

// Interceptors
export { x402AxiosInterceptor } from './interceptors/axios.js';
export { x402Fetch } from './interceptors/fetch.js';

// Facilitators
export { GenericFacilitator } from './facilitators/generic.js';

// Types
export type {
  PaymentOptions,
  PaymentRequirements,
  CostEstimate,
  PaymentResult,
  SignerFunction,
  FacilitatorAdapter,
  ClientConfig
} from './types.js';
