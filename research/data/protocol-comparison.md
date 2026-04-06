# Protocol Comparison

*Extracted from MoltPe Research reports, March 2026.*

## Protocol Overview

| Protocol | Layer | Primary Rail | Status | Verified Volume | Key Innovation |
|----------|-------|-------------|--------|-----------------|----------------|
| **x402** | HTTP execution | USDC on Base / Polygon / Solana | Live (May 2025) | ~$1.6M/month (Artemis, filtered) | HTTP 402 status code repurposed for machine-readable payment; one-line middleware integration |
| **MPP** | Session streaming | Tempo L1 + cards + Lightning | Live (March 18, 2026) | Zero (days old at writing) | "OAuth for money" — authorize budget once, stream micropayments within session; no per-request settlement |
| **ACP** | Commerce checkout | Cards via Shared Payment Tokens (SPTs) | Live in ChatGPT (US) | Verified purchases (volume undisclosed) | Full purchase lifecycle (carts, shipping, returns); ChatGPT Instant Checkout with Etsy, Glossier, SKIMS |
| **AP2** | Trust / authorization | Payment-agnostic | Spec published | No production data | Cryptographically signed "Mandates" (Verifiable Digital Credentials) prove user intent; 60+ partner orgs |

## Protocol Details

### x402

- **Backers:** Coinbase, Cloudflare, Google, Visa (x402 Foundation)
- **SDK languages:** TypeScript, Go, Python
- **GitHub stars:** 5,400+
- **npm downloads:** ~2,747/week (Axios package)
- **CDP facilitator:** Supports Base, Polygon, Solana; free tier 1,000 tx/month; then $0.001/tx
- **V2 additions (December 2025):** Wallet-based identity, reusable sessions, multi-chain via CAIP standards
- **Wash trade issue:** 48% of transactions / 81% of volume gamed (Artemis, Dec 2025)
- **Best use cases:** Pay-per-call APIs, content paywalls, GPU compute billing

### MPP (Machine Payment Protocol)

- **Backers:** Stripe, Tempo Labs (Paradigm-backed, $500M raised at $5B valuation)
- **Settlement chain:** Tempo L1 — 100,000+ TPS, sub-second finality
- **Design partners:** Visa, Lightspark (Bitcoin Lightning), Deutsche Bank
- **Launch partners:** 100+ services including Browserbase, PostalForm, Prospect Butcher Co
- **Core primitive:** Sessions — authorize a spend limit, draw against it continuously
- **Best use cases:** Multi-turn agent interactions, high-frequency service billing, session-based agent relationships

### ACP (Agent Commerce Protocol)

- **Backers:** Stripe, OpenAI
- **Mechanism:** Shared Payment Tokens (SPTs) for secure credential passing across merchants
- **Live deployments:** ChatGPT Instant Checkout (US), Stripe Agentic Commerce Suite
- **Merchants:** Etsy, Glossier, Vuori, SKIMS, URBN, Coach, Kate Spade, Ashley Furniture
- **Platforms:** Wix, WooCommerce, BigCommerce
- **Best use cases:** Consumer e-commerce, standard purchase flows, marketplace transactions

### AP2 (Agent Payment Protocol v2)

- **Backer:** Google
- **Mechanism:** Cryptographic "Mandates" — Verifiable Digital Credentials that encode payment authorization
- **Partner organizations:** 60+ including American Express, Mastercard, PayPal, Salesforce
- **Extension:** A2A x402 (co-developed with Coinbase and MetaMask) enables stablecoin payments within Google agent framework
- **Best use cases:** Delegation chains, enterprise agent spending policies, audit trails, multi-agent governance

## Protocol Stack Model

These protocols operate at different layers and are not direct competitors:

```
Layer 4 — Trust / Authorization:    AP2 (Google)
Layer 3 — Commerce Lifecycle:       ACP (Stripe + OpenAI)
Layer 2 — Session Management:       MPP (Stripe + Tempo)
Layer 1 — HTTP Execution:           x402 (Coinbase + Cloudflare)
```

A single enterprise deployment may use all four simultaneously. Stripe supports all four protocols. The competitive question is who owns the abstraction layer above them.

## Developer Preference by Use Case

| Use Case | Preferred Protocol |
|----------|--------------------|
| API micropayments / agent-to-agent | x402 |
| Consumer e-commerce (enterprise Stripe users) | ACP / MPP |
| Agent identity as primary requirement | Skyfire KYA (not a protocol, but adjacent) |
| Any merchant, card-network compatible | Crossmint |

## Key Developer Friction Points (x402)

1. V1 required full payment flow per API call — burned early adopters before V2 sessions
2. Only USDC works seamlessly (EIP-3009 tokens); Permit2 for other ERC-20s still rolling out
3. CDP facilitator centralization concerns (single-point-of-dependency)
4. Blockchain complexity leaks through — custom polling logic required in some integrations
5. No dispute resolution mechanism
