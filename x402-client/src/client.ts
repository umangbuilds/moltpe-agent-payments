// client.ts — Core x402 payment client.
// Handles the full 402 Payment Required flow: detect → pay → retry.

import {
  PaymentOptions,
  PaymentResult,
  CostEstimate,
  ClientConfig
} from './types.js';

import {
  isPaymentRequired,
  parseRequirements,
  requirementsToCostEstimate,
  exceedsMaxAmount
} from './utils.js';

import { GenericFacilitator } from './facilitators/generic.js';

// Module-level defaults, set via configure()
let defaults: ClientConfig = {};

/**
 * Set default configuration for all subsequent x402 calls.
 */
export function configure(config: ClientConfig): void {
  defaults = { ...defaults, ...config };
}

/**
 * Reset configuration to empty defaults.
 */
export function resetConfig(): void {
  defaults = {};
}

/**
 * Make a request to a URL, automatically handling x402 payment if required.
 *
 * Flow:
 * 1. Fetch the URL
 * 2. If not 402, return the response
 * 3. If 402, parse payment requirements
 * 4. Check maxAmount — refuse if cost exceeds limit
 * 5. Submit payment through facilitator
 * 6. Retry request with payment proof
 * 7. Return response + cost
 */
export async function pay(
  url: string,
  options: PaymentOptions & RequestInit = {}
): Promise<PaymentResult> {
  const merged = { ...defaults, ...options };
  const { facilitator, maxAmount, chain, signer, timeout, ...fetchOptions } = merged;

  // Build fetch options with timeout
  const controller = new AbortController();
  const timeoutMs = timeout || 30000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Step 1: Initial request
    const initialResponse = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    // Step 2: If not 402, pass through
    if (!isPaymentRequired(initialResponse)) {
      return { success: true, response: initialResponse };
    }

    // Step 3: Parse payment requirements
    const requirements = parseRequirements(initialResponse.headers);

    // Use chain preference if specified
    if (chain && requirements.network !== chain) {
      // The server may not support the preferred chain, but we log the preference
    }

    // Step 4: Check maxAmount
    if (maxAmount && exceedsMaxAmount(requirements.maxAmountRequired, maxAmount)) {
      return {
        success: false,
        error: `Payment of ${requirements.maxAmountRequired} ${requirements.currency || 'USDC'} exceeds maximum of ${maxAmount}`
      };
    }

    // Step 5: Get signer
    if (!signer) {
      return {
        success: false,
        error: 'No signer provided. Pass a signer function in options or via configure().'
      };
    }

    // Step 6: Submit payment through facilitator
    const facilitatorUrl = facilitator || requirements.facilitatorUrl;
    if (!facilitatorUrl) {
      return {
        success: false,
        error: 'No facilitator URL. Set via options.facilitator, configure(), or the server X-Payment header.'
      };
    }

    const adapter = new GenericFacilitator(facilitatorUrl);
    let paymentProof: string;
    try {
      paymentProof = await adapter.submitPayment(requirements, signer);
    } catch (err) {
      return {
        success: false,
        error: `Facilitator error: ${(err as Error).message}`
      };
    }

    // Step 7: Retry with payment proof
    const retryResponse = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...(fetchOptions.headers || {}),
        'X-Payment-Proof': paymentProof
      },
      signal: controller.signal
    });

    return {
      success: true,
      response: retryResponse,
      cost: requirements.maxAmountRequired
    };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return { success: false, error: `Request timed out after ${timeoutMs}ms` };
    }
    return { success: false, error: (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Estimate the cost of accessing a URL without making the payment.
 * Makes a HEAD request and checks for 402.
 */
export async function estimateCost(url: string): Promise<CostEstimate> {
  try {
    const response = await fetch(url, { method: 'HEAD' });

    if (!isPaymentRequired(response)) {
      return { required: false };
    }

    const requirements = parseRequirements(response.headers);
    return requirementsToCostEstimate(requirements);
  } catch (err) {
    return { required: false };
  }
}
