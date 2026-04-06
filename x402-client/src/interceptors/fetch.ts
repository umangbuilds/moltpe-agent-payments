// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// fetch.ts — Drop-in fetch wrapper that handles x402 payments automatically.
// Usage: const response = await x402Fetch('https://api.example.com/data', options)

import { PaymentOptions } from '../types.js';
import { pay } from '../client.js';

/**
 * Drop-in replacement for fetch() that handles x402 payments.
 *
 * Usage:
 *   import { x402Fetch } from '@moltpe/x402-client';
 *
 *   const response = await x402Fetch('https://api.example.com/data', {
 *     facilitator: 'https://xpay.sh/facilitator',
 *     signer: mySignerFunction,
 *     maxAmount: '0.10'
 *   });
 */
export async function x402Fetch(
  url: string,
  init?: RequestInit & PaymentOptions
): Promise<Response> {
  const result = await pay(url, init);

  if (!result.success) {
    throw new Error(result.error || 'x402 payment failed');
  }

  if (!result.response) {
    throw new Error('No response received');
  }

  return result.response;
}
