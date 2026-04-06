// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// generic.ts — Generic facilitator adapter.
// Works with any x402-compatible facilitator (xpay.sh, Coinbase CDP, custom).

import { PaymentRequirements, SignerFunction, FacilitatorAdapter } from '../types.js';

/**
 * Generic facilitator that submits payment to any x402-compatible facilitator URL.
 *
 * The flow:
 * 1. Sign the payment authorization using the provided signer
 * 2. POST the signed authorization to the facilitator URL
 * 3. Return the payment proof from the facilitator response
 */
export class GenericFacilitator implements FacilitatorAdapter {
  name: string;
  private facilitatorUrl: string;

  constructor(facilitatorUrl: string) {
    this.name = 'generic';
    this.facilitatorUrl = facilitatorUrl;
  }

  async submitPayment(
    requirements: PaymentRequirements,
    signer: SignerFunction
  ): Promise<string> {
    // Step 1: Build the payment message to sign
    const paymentMessage = JSON.stringify({
      scheme: requirements.scheme,
      network: requirements.network,
      amount: requirements.maxAmountRequired,
      resource: requirements.resource,
      payTo: requirements.payTo,
      currency: requirements.currency || 'USDC',
      timestamp: Date.now()
    });

    // Step 2: Sign the payment authorization
    const signature = await signer(paymentMessage);

    // Step 3: Submit to facilitator
    const response = await fetch(this.facilitatorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirements,
        signature,
        signedMessage: paymentMessage
      })
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`Facilitator returned ${response.status}: ${errorBody}`);
    }

    const result = await response.json() as { paymentProof?: string };

    if (!result.paymentProof) {
      throw new Error('Facilitator response missing paymentProof');
    }

    return result.paymentProof;
  }
}
