# Production Security Checklist

Checklist for deploying MoltPe Agent Payments (or any agent payment system) in production. This covers what the reference implementation demonstrates and what you must add before handling real money.

> **Status:** Reference implementation uses mock data. Every item marked "Demo" is already implemented. Items marked "Production" must be added before going live.

## Authentication & Authorization

- [x] **Bearer token per agent** — Demo: tokens in seed data, validated on every request
- [x] **Timing-safe comparison** — Demo: `crypto.timingSafeEqual` prevents timing attacks
- [ ] **Token rotation** — Production: implement token expiry and rotation without downtime
- [ ] **Scoped permissions** — Production: per-tool or per-provider access control (e.g., agent A can only use x402, not fiat)
- [ ] **OAuth 2.0 or mTLS** — Production: replace bearer tokens with industry-standard auth for agent-to-server communication
- [ ] **Admin authentication** — Production: separate admin credentials for server management, never shared with agent tokens
- [ ] **API key hashing** — Production: store only hashed tokens server-side, never plaintext

## Payment Controls

- [x] **Daily spending limits** — Demo: per-agent limits enforced in mock providers
- [x] **Balance checks before send** — Demo: insufficient balance rejected with clear error
- [ ] **Per-transaction amount ceiling** — Production: reject payments above threshold without human approval
- [ ] **Human-in-the-loop** — Production: require manual approval for transactions above a configurable amount
- [ ] **Velocity checks** — Production: flag unusual patterns (e.g., 50 transactions in 1 minute from one agent)
- [ ] **Duplicate detection** — Production: idempotency keys to prevent double-payments on retry
- [ ] **Currency validation** — Production: reject unsupported currencies, validate amounts are positive and within precision limits
- [ ] **Refund controls** — Production: refund requires separate authorization, capped at original transaction amount

## Agent Isolation

- [x] **Separate balances per agent** — Demo: each agent has independent balance tracking
- [x] **Provider isolation** — Demo: stablecoin, session, and fiat providers share no state
- [ ] **Tenant isolation** — Production: if multi-tenant, enforce strict data separation between organizations
- [ ] **Resource quotas** — Production: cap memory, CPU, and connection usage per agent to prevent noisy-neighbor issues
- [ ] **Session isolation** — Production: MPP sessions bound to specific agent, cannot be hijacked by another
- [ ] **Wallet isolation** — Production: each agent's on-chain wallet is a separate address, never shared

## Monitoring & Audit

- [ ] **Structured logging** — Production: JSON logs with timestamp, agent ID, tool name, amount, status, latency
- [ ] **Tamper-evident audit trail** — Production: append-only log storage (e.g., CloudWatch Logs, BigQuery) that cannot be altered after write
- [ ] **Real-time alerting** — Production: alert on failed payments, auth failures, rate limit hits, balance anomalies
- [ ] **Dashboard** — Production: live view of transaction volume, error rates, agent activity, balance trends
- [ ] **Reconciliation** — Production: automated daily reconciliation between internal ledger and on-chain/gateway records
- [ ] **Log retention policy** — Production: define retention period (e.g., 7 years for financial records), automate archival
- [ ] **Incident correlation** — Production: trace ID across all services for end-to-end request tracking

## Network Security

- [x] **CORS headers** — Demo: configured for local development
- [ ] **TLS everywhere** — Production: enforce HTTPS on all endpoints, reject plain HTTP
- [ ] **HSTS** — Production: `Strict-Transport-Security` header with long max-age
- [ ] **Content-Security-Policy** — Production: restrict inline scripts, prevent XSS
- [ ] **X-Frame-Options** — Production: prevent clickjacking with DENY or SAMEORIGIN
- [ ] **X-Content-Type-Options** — Production: `nosniff` to prevent MIME type sniffing
- [ ] **Rate limiting** — Production: per-IP and per-token rate limits with backoff (demo has in-memory token bucket; production needs distributed rate limiting)
- [ ] **DDoS protection** — Production: CDN or WAF in front of payment endpoints
- [ ] **Private networking** — Production: payment server not directly internet-facing; use reverse proxy or API gateway

## Stablecoin-Specific (x402)

- [x] **External signer** — Demo: x402 client requires external signer function, never handles private keys
- [ ] **Chain verification** — Production: verify on-chain settlement before marking payment complete
- [ ] **Gas estimation** — Production: estimate and cap gas fees before submitting transactions
- [ ] **Nonce management** — Production: sequential nonce tracking to prevent transaction replay
- [ ] **Chain monitoring** — Production: watch for chain reorgs that could reverse settled payments
- [ ] **Multi-chain support** — Production: validate chain ID matches expected network (Polygon, Base, etc.)
- [ ] **Facilitator validation** — Production: verify facilitator contract addresses against a trusted registry
- [ ] **Slippage protection** — Production: reject if USDC price deviates beyond acceptable range during settlement

## Session-Specific (MPP)

- [x] **Budget enforcement** — Demo: session spending capped at authorized budget
- [x] **Session expiry** — Demo: sessions have TTL, status checked on each call
- [ ] **Session revocation** — Production: ability to instantly revoke an active session (e.g., if agent compromised)
- [ ] **Budget adjustment controls** — Production: budget increases require re-authorization
- [ ] **Concurrent session limits** — Production: cap active sessions per agent to prevent resource exhaustion
- [ ] **Settlement finality** — Production: define when session payments are final and irreversible
- [ ] **Partial settlement** — Production: handle cases where session closes with unused budget (refund or rollover)

## Fiat-Specific

- [ ] **PCI DSS compliance** — Production: if handling card data, full PCI compliance required (see SECURITY.md disclaimer)
- [ ] **Tokenized card storage** — Production: never store raw card numbers; use gateway tokenization
- [ ] **3D Secure** — Production: implement 3DS for card transactions where required by regulation
- [ ] **Chargeback handling** — Production: process for handling disputes, evidence submission, and fund holds
- [ ] **KYC/AML** — Production: identity verification for agents or their operators, transaction monitoring for suspicious activity
- [ ] **Multi-currency** — Production: handle currency conversion, display amounts in payer's currency

## Incident Response

- [ ] **Runbook** — Production: documented procedures for payment failures, security breaches, and service outages
- [ ] **Kill switch** — Production: ability to instantly disable all payments (global) or per-agent
- [ ] **Communication plan** — Production: notify affected agents/operators within defined SLA after incident
- [ ] **Post-mortem process** — Production: blameless post-mortem for every payment-affecting incident
- [ ] **Backup & recovery** — Production: regular backups of ledger state, tested restore procedure
- [ ] **Escalation path** — Production: defined contacts for payment provider issues, chain issues, security events

---

## Summary

| Category | Demo Items | Production Items |
|----------|-----------|-----------------|
| Authentication | 2 | 5 |
| Payment Controls | 2 | 6 |
| Agent Isolation | 2 | 4 |
| Monitoring & Audit | 0 | 7 |
| Network Security | 1 | 8 |
| Stablecoin (x402) | 1 | 7 |
| Session (MPP) | 2 | 5 |
| Fiat | 0 | 6 |
| Incident Response | 0 | 6 |
| **Total** | **10** | **54** |

10 items demonstrated in the reference implementation. 54 items to implement before production deployment.

## Related

- [SECURITY.md](../SECURITY.md) — vulnerability reporting and security posture
- [QUALITY.md](../QUALITY.md) — test results, coverage, and scan findings
