# The Collections Gap

Market opportunity for agent receivables.

## The Problem

Most agent payment infrastructure focuses on agents-as-buyers: an agent needs to pay for an API call, purchase data, or subscribe to a service. The paying side is well-served by protocols like x402 and MPP.

The receiving side is not.

## What Exists Today

**PayPal MCP** is the only production solution that lets agents receive payments. It enables agents to create invoices, send payment requests, and track receivables through PayPal's ecosystem.

The limitation: it is locked to the PayPal ecosystem. An agent using PayPal MCP can only collect from PayPal users, through PayPal's interface, on PayPal's terms.

## What's Missing

### Agent-to-Agent Billing

When Agent A performs work for Agent B, how does Agent A bill for it? Current protocols handle the payment transfer but not the billing lifecycle: generating an invoice, tracking payment status, handling partial payments, managing disputes.

### Subscription Management

Agents that provide ongoing services need subscription billing. This means: plan definition, usage tracking, proration, upgrades/downgrades, dunning (failed payment retry), and cancellation. No agent-native solution exists for this.

### Autonomous Accounts Receivable

A full AR system for agents would include:
- Invoice generation and delivery
- Payment matching and reconciliation
- Aging reports and follow-up
- Write-off policies
- Multi-currency support

### Dispute Resolution

When an agent pays for a service and the result is unsatisfactory, what happens? Credit card chargebacks exist for human transactions. Agent-to-agent transactions have no equivalent. Dispute resolution for autonomous payments is an unsolved problem.

## Why Collections Is Payment-Method-Agnostic

Collections sits above the payment rail. Whether the underlying payment is stablecoin (x402), session-based (MPP), or fiat (card/bank), the collections layer handles the same concerns: who owes what, what has been paid, what is overdue, and what to do about it.

This means a collections solution does not need to pick a winning payment protocol. It needs to integrate with all of them.

## Summary

The market has focused on making it easy for agents to spend money. The gap is making it easy for agents to collect money. Whoever solves agent receivables — billing, subscriptions, AR, disputes — across multiple payment rails will fill a structural gap in the agent economy.
