// utils.ts — Helper functions for parsing x402 payment requirements.

import { PaymentRequirements, CostEstimate } from './types.js';

/**
 * Check if a response requires payment (HTTP 402).
 */
export function isPaymentRequired(response: { status: number }): boolean {
  return response.status === 402;
}

/**
 * Parse payment requirements from a 402 response.
 * The x402 protocol encodes requirements in the X-Payment header as JSON.
 */
export function parseRequirements(headers: Headers | Record<string, string>): PaymentRequirements {
  let paymentHeader: string | null = null;

  if (headers instanceof Headers) {
    paymentHeader = headers.get('x-payment');
  } else if (typeof headers === 'object') {
    // Handle plain object headers (case-insensitive lookup)
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === 'x-payment') {
        paymentHeader = value;
        break;
      }
    }
  }

  if (!paymentHeader) {
    throw new Error('Missing X-Payment header in 402 response');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(paymentHeader);
  } catch {
    throw new Error('Invalid X-Payment header: not valid JSON');
  }

  if (!parsed.maxAmountRequired || !parsed.network) {
    throw new Error('Invalid X-Payment header: missing required fields (maxAmountRequired, network)');
  }

  return {
    scheme: (parsed.scheme as string) || 'exact',
    network: parsed.network as string,
    maxAmountRequired: String(parsed.maxAmountRequired),
    resource: (parsed.resource as string) || '',
    description: parsed.description as string | undefined,
    facilitatorUrl: parsed.facilitatorUrl as string | undefined,
    payTo: parsed.payTo as string | undefined,
    currency: (parsed.currency as string) || 'USDC'
  };
}

/**
 * Convert payment requirements to a cost estimate.
 */
export function requirementsToCostEstimate(requirements: PaymentRequirements): CostEstimate {
  return {
    required: true,
    amount: requirements.maxAmountRequired,
    currency: requirements.currency || 'USDC',
    network: requirements.network,
    description: requirements.description
  };
}

/**
 * Check if the payment amount exceeds the configured maximum.
 */
export function exceedsMaxAmount(required: string, maxAmount: string): boolean {
  const requiredNum = parseFloat(required);
  const maxNum = parseFloat(maxAmount);
  if (isNaN(requiredNum) || isNaN(maxNum)) return true;
  return requiredNum > maxNum;
}
