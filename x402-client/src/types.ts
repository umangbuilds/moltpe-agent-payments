// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// types.ts — All TypeScript interfaces for the x402 client SDK.

/**
 * Options for making x402 payments.
 */
export interface PaymentOptions {
  /** Facilitator URL to submit payment through */
  facilitator?: string;
  /** Maximum amount willing to pay (e.g., "0.10") */
  maxAmount?: string;
  /** Preferred chain (e.g., "base", "polygon") */
  chain?: string;
  /** Function that signs payment authorization messages */
  signer?: SignerFunction;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Payment requirements parsed from a 402 response.
 */
export interface PaymentRequirements {
  /** Payment scheme (e.g., "exact") */
  scheme: string;
  /** Chain/network identifier */
  network: string;
  /** Amount required to pay */
  maxAmountRequired: string;
  /** Resource being paid for (URL or identifier) */
  resource: string;
  /** Human-readable description of what is being paid for */
  description?: string;
  /** URL of the facilitator to submit payment to */
  facilitatorUrl?: string;
  /** Recipient wallet address */
  payTo?: string;
  /** Currency (e.g., "USDC") */
  currency?: string;
}

/**
 * Cost estimate for a URL.
 */
export interface CostEstimate {
  /** Whether payment is required to access this URL */
  required: boolean;
  /** Amount required (if payment required) */
  amount?: string;
  /** Currency of the payment */
  currency?: string;
  /** Chain/network for payment */
  network?: string;
  /** Description of what is being paid for */
  description?: string;
}

/**
 * Result of a payment attempt.
 */
export interface PaymentResult {
  /** Whether the payment and request succeeded */
  success: boolean;
  /** The API response after successful payment */
  response?: Response;
  /** Amount paid */
  cost?: string;
  /** Error message if payment failed */
  error?: string;
}

/**
 * Function that signs a message for payment authorization.
 * The SDK does NOT handle private keys — pass a signer function instead.
 */
export type SignerFunction = (message: string) => Promise<string>;

/**
 * Adapter for submitting payments through a facilitator.
 */
export interface FacilitatorAdapter {
  /** Name of the facilitator */
  name: string;
  /** Submit a payment and return the payment proof header value */
  submitPayment(requirements: PaymentRequirements, signer: SignerFunction): Promise<string>;
}

/**
 * Configuration for the x402 client.
 */
export interface ClientConfig {
  /** Default facilitator URL */
  facilitator?: string;
  /** Default max amount */
  maxAmount?: string;
  /** Default chain */
  chain?: string;
  /** Default signer function */
  signer?: SignerFunction;
  /** Default timeout in ms */
  timeout?: number;
}
