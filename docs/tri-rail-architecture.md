# Tri-Rail Architecture

Three parallel payment paths for AI agents.

## Overview

This reference implementation supports three payment paths. Each serves different use cases and operates on different infrastructure. A collections layer sits above all three.

```
                    ┌─────────────────────────┐
                    │    COLLECTIONS LAYER     │
                    │  Agent receivables, AR,  │
                    │  billing, subscriptions  │
                    └────────┬────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │  PATH A    │  │  PATH B    │  │  PATH C    │
     │ Stablecoin │  │  Session   │  │   Fiat     │
     │   x402     │  │   MPP      │  │ Card/Bank  │
     └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
           │                │                │
           ▼                ▼                ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ On-chain │    │ Platform │    │ Payment  │
     │  USDC    │    │ accounts │    │processor │
     └──────────┘    └──────────┘    └──────────┘
```

## Path A — Stablecoin (x402)

Per-request micropayments settled on-chain in USDC.

**How it works:**
1. Agent calls an API endpoint
2. Server returns `402 Payment Required` with price and payment address
3. Agent constructs x402 payment header with USDC transfer
4. Agent retries the request with payment attached
5. Server verifies on-chain payment and serves the response

**Use cases:**
- Pay-per-call API access
- Content micropayments
- Compute billing (per-inference, per-token)

**Trade-offs:**
- Fast for small amounts (seconds)
- On-chain settlement means real finality
- Gas costs make sub-cent payments impractical on some chains
- Requires the agent to hold USDC in a wallet

## Path B — Session-Based (MPP)

Authorize a budget, stream payments within a session.

**How it works:**
1. Agent establishes a session with a service provider
2. Agent authorizes a maximum spend for the session
3. Service provider draws against the authorized amount as work completes
4. Session closes and final settlement occurs

**Use cases:**
- Multi-turn conversations with paid APIs
- Ongoing agent-to-agent service relationships
- Usage-based billing within a time window

**Trade-offs:**
- Low latency (no per-request settlement)
- Budget caps prevent runaway spending
- Requires trust in the session mediator
- Less granular than per-request payment

## Path C — Fiat

Traditional card authorization, capture, and settlement. Bank transfers for larger amounts.

**How it works:**
1. Agent (or its principal) provides card credentials or bank account
2. Payment processor authorizes the transaction
3. On fulfillment, the charge is captured
4. Settlement occurs through standard banking rails

**Note on UPI:** This implementation does not include UPI. UPI integration requires a PSP license issued by NPCI, which is a regulatory requirement separate from technical implementation.

**Use cases:**
- Enterprise agent spending on existing vendor relationships
- Subscription payments for agent services
- Large-value transactions where stablecoin liquidity is limited

**Trade-offs:**
- Familiar infrastructure, wide merchant acceptance
- Settlement takes 1-3 business days
- Higher transaction fees for small amounts
- Requires KYC/identity for the paying entity

## Why Three Paths

No single payment rail covers all agent use cases:

- **Micropayments** (sub-$1) need stablecoin rails — card fees make them uneconomical on fiat
- **Session billing** needs streaming — per-request settlement adds unnecessary latency
- **Enterprise spending** needs fiat — most businesses operate in dollars and have existing card/bank infrastructure

The collections layer above all three paths provides a unified interface for agent receivables, regardless of which rail carried the payment.
