# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email: security@moltpe.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix or mitigation:** Dependent on severity

## Scope

This repository is a **reference implementation**. It contains mock data and placeholder adapters. It is NOT intended for direct production deployment without implementing real payment provider adapters and completing a security audit.

## Security Posture

### What this repo contains
- Mock payment providers with test data only
- No real credentials, private keys, or wallet secrets
- No access to production payment infrastructure
- Test tokens are clearly labeled (`test-token-alice`, `test-token-bob`, `test-token-charlie`)

### What this repo does NOT contain
- Real payment processing code
- Private keys or wallet mnemonics
- Production API credentials
- Customer or user data

### Scan Results (April 2026)
- **npm audit:** 0 vulnerabilities (both packages)
- **Secret scan:** Clean — zero credentials in source (32 files scanned)
- **Vulnerable pattern scan:** 1 finding — deliberate `Function()` for lazy dynamic import in x402 axios interceptor, not user-input-driven
- **Dependency count:** 0 runtime dependencies (both packages)

### Financial Security Patterns
This reference implementation demonstrates these payment security patterns:
- **Isolated agent wallets**: Each agent has separate balance tracking, no shared state
- **Spending limits**: Daily limits enforced per agent, configurable per deployment
- **Provider isolation**: Stablecoin, session, and fiat providers share no state
- **Token-based auth**: Bearer tokens per agent, no shared secrets
- **Idempotency**: Tool calls are stateless; duplicate calls return consistent results
- **Input validation**: All tool inputs validated against JSON Schema before execution
- **No credential storage**: x402 client requires external signer function, never handles private keys directly

For production deployments, additionally implement:
- Rate limiting per agent token
- Replay protection (nonce or timestamp-based)
- Transaction amount ceilings with human-in-the-loop above threshold
- Audit logging with tamper-evident storage
- Network-level TLS enforcement

See [docs/production-security-checklist.md](docs/production-security-checklist.md) for the full checklist.

## PCI Compliance Disclaimer

This reference implementation does not handle real card numbers or sensitive authentication data. Any production deployment that processes card payments must comply with PCI DSS requirements independently. This codebase does not claim PCI compliance.

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | Yes       |
