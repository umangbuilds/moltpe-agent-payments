// index.ts — Public API exports for the x402 client SDK.

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
