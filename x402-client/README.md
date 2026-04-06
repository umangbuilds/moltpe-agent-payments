# x402 Client SDK

Lightweight TypeScript SDK for x402 micropayments from AI agents.

> **What is x402?** The x402 protocol adds payment to HTTP. A server returns `402 Payment Required` with a price and payment address. This SDK handles the payment and retries the request automatically.

## When to Use x402 vs MPP

Use **x402** for per-request micropayments where each API call is independently priced and settled on-chain in USDC. Use **MPP** for session-based streaming where you authorize a budget and make multiple payments within a session. See [protocol-landscape.md](../docs/protocol-landscape.md) for details.

## Quick Start (Fetch Wrapper)

```typescript
import { x402Fetch } from '@moltpe/x402-client';

const response = await x402Fetch('https://api.example.com/data', {
  facilitator: 'https://xpay.sh/facilitator',
  signer: mySignerFunction,
  maxAmount: '0.10'
});
```

## Manual Flow

```typescript
import { pay } from '@moltpe/x402-client';

const result = await pay('https://api.example.com/data', {
  facilitator: 'https://xpay.sh/facilitator',
  signer: mySignerFunction,
  maxAmount: '0.10'
});

if (result.success) {
  const data = await result.response.json();
  console.log(`Got data, paid ${result.cost} USDC`);
} else {
  console.error(result.error);
}
```

## Cost Estimation

```typescript
import { estimateCost } from '@moltpe/x402-client';

const estimate = await estimateCost('https://api.example.com/data');
if (estimate.required) {
  console.log(`Cost: ${estimate.amount} ${estimate.currency} on ${estimate.network}`);
}
```

## Axios Interceptor

```typescript
import axios from 'axios';
import { x402AxiosInterceptor } from '@moltpe/x402-client';

axios.interceptors.response.use(
  undefined,
  x402AxiosInterceptor({
    facilitator: 'https://xpay.sh/facilitator',
    signer: mySignerFunction,
    maxAmount: '0.10'
  })
);

// Any 402 response is now handled automatically
const { data } = await axios.get('https://api.example.com/data');
```

## Global Configuration

```typescript
import { configure } from '@moltpe/x402-client';

configure({
  facilitator: 'https://xpay.sh/facilitator',
  signer: mySignerFunction,
  maxAmount: '1.00',
  chain: 'base'
});
```

## Facilitator Setup

See [src/facilitators/README.md](src/facilitators/README.md) for configuration options including xpay.sh, Coinbase CDP, and custom facilitators.

## Security

This SDK does NOT handle private keys. You must provide a signer function that signs payment authorization messages. The signer could be a browser wallet, a server-side HSM, or a Coinbase Smart Wallet. Never pass raw private keys.

## API Reference

| Function | Description |
|----------|-------------|
| `pay(url, options?)` | Make a request, handle x402 payment if needed |
| `estimateCost(url)` | Check if a URL requires payment and how much |
| `configure(config)` | Set defaults for all subsequent calls |
| `resetConfig()` | Clear all defaults |
| `isPaymentRequired(response)` | Check if a response is HTTP 402 |
| `parseRequirements(headers)` | Extract payment requirements from headers |
| `x402Fetch(url, init?)` | Drop-in fetch replacement with x402 handling |
| `x402AxiosInterceptor(options?)` | Axios error interceptor for x402 |
| `GenericFacilitator` | Adapter for any x402-compatible facilitator |

## Build

```bash
npm install
npm run build    # Produces dist/esm/ + dist/cjs/ + dist/types/
npm test         # Run tests
```

## License

[Apache License 2.0](../LICENSE)
