# Protocol Landscape

Where x402, MPP, ACP, and AP2 fit in the agent payment stack.

## The Four Protocols

### x402 — HTTP Payment Execution

x402 adds payment to HTTP. A server returns `402 Payment Required` with a price and payment address. The client constructs a payment header, attaches it to the retry request, and the server verifies payment before serving the response.

- **Layer:** Execution (per-request settlement)
- **Payment type:** Stablecoin micropayments (USDC)
- **Backed by:** Coinbase, Cloudflare
- **Best for:** Pay-per-call APIs, content access, compute billing
- **Settlement:** On-chain (Base, Ethereum, Polygon)

### MPP — Machine Payment Protocol

MPP establishes payment sessions between agents. Think of it as "OAuth for money" — an agent authorizes a payment budget, and the counterparty draws against it during the session. Payments stream rather than settling per-request.

- **Layer:** Session (streaming settlement)
- **Payment type:** Session-authorized budgets
- **Backed by:** Stripe, Tempo Labs
- **Best for:** Multi-turn agent interactions, ongoing service relationships
- **Settlement:** Platform-mediated

### ACP — Agent Commerce Protocol

ACP handles full purchase lifecycle: product discovery, cart management, checkout, and fulfillment tracking. It is the commerce layer where agents buy and sell goods and services.

- **Layer:** Commerce (full purchase lifecycle)
- **Payment type:** Standard purchase flows
- **Backed by:** Stripe, OpenAI
- **Best for:** Agent marketplace transactions, SaaS subscriptions, physical goods
- **Settlement:** Payment processor-mediated

### AP2 — Agent-to-Agent Payment Protocol

AP2 focuses on trust and authorization. It uses cryptographic mandates to define what one agent is allowed to pay on behalf of another. It is the authorization layer that other protocols build on.

- **Layer:** Trust and authorization
- **Payment type:** Cryptographic payment mandates
- **Backed by:** Google
- **Best for:** Delegation chains, enterprise agent spending policies, audit trails
- **Settlement:** Mandate-defined

## Protocol Comparison

| Aspect | x402 | MPP | ACP | AP2 |
|--------|------|-----|-----|-----|
| Layer | Execution | Session | Commerce | Trust |
| Settlement | Per-request | Per-session | Per-purchase | Per-mandate |
| Currency | USDC (on-chain) | Fiat + crypto | Fiat + crypto | Any |
| Latency | Seconds (chain) | Milliseconds | Seconds | N/A (auth only) |
| Best fit | Micropayments | Streaming | Commerce | Authorization |
| Backers | Coinbase, Cloudflare | Stripe, Tempo | Stripe, OpenAI | Google |

## The Abstraction Question

These protocols are not competitors — they operate at different layers. x402 handles execution, MPP handles sessions, ACP handles commerce, and AP2 handles trust. A complete agent payment system may use all four.

The question is not which protocol wins but who owns the abstraction layer above them. The provider that unifies these protocols behind a single interface — letting agents pay without knowing which rail carries the payment — captures the most value in the stack.
