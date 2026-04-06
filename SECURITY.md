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

## PCI Compliance Disclaimer

This reference implementation does not handle real card numbers or sensitive authentication data. Any production deployment that processes card payments must comply with PCI DSS requirements independently. This codebase does not claim PCI compliance.

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | Yes       |
