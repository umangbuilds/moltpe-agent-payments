# Facilitator Configuration

The x402 client SDK uses facilitator adapters to submit payments. A facilitator is a service that processes the on-chain payment on behalf of the agent.

## Available Facilitators

### xpay.sh (Recommended for testing)

- URL: `https://xpay.sh/facilitator`
- Supports EOA wallets (standard Ethereum wallets)
- Zero fees on testnet
- Chains: Base, Polygon, Ethereum

```typescript
import { configure } from '@moltpe/x402-client';

configure({
  facilitator: 'https://xpay.sh/facilitator',
  signer: myWalletSigner
});
```

### Coinbase CDP

- URL: `https://x402.org/facilitator`
- Requires Smart Wallet (via Coinbase SDK)
- Free tier: 1,000 transactions/month, then $0.001/tx
- Chains: Base, Polygon, Solana

```typescript
configure({
  facilitator: 'https://x402.org/facilitator',
  signer: cdpSmartWalletSigner
});
```

### Custom Facilitator

Implement the `FacilitatorAdapter` interface:

```typescript
import { FacilitatorAdapter, PaymentRequirements, SignerFunction } from '@moltpe/x402-client';

class MyFacilitator implements FacilitatorAdapter {
  name = 'my-facilitator';

  async submitPayment(
    requirements: PaymentRequirements,
    signer: SignerFunction
  ): Promise<string> {
    // Your payment submission logic
    return 'payment-proof-header-value';
  }
}
```

## Security

This SDK does NOT handle private keys. You must provide a signer function that signs messages. The signer could be:

- A browser wallet (MetaMask, Coinbase Wallet)
- A server-side HSM or KMS
- A Coinbase CDP Smart Wallet
- Any function that takes a string and returns a signed string

Never pass raw private keys to this SDK.
