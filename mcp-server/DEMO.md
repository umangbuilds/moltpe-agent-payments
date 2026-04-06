# Demo Script

Step-by-step walkthrough of the interactive demo UI.

## Prerequisites

- Node.js 18+
- This repository cloned locally (or opened in GitHub Codespaces)

## 1. Start the Server

```bash
cd mcp-server
npm install
npm start
```

Server starts on port 3000.

## 2. Open the Demo UI

Visit http://localhost:3000 in your browser.

## 3. Stablecoin Path (x402)

1. Click the "Stablecoin/x402" tab
2. Click "check_balance" — see agent-alice's USDC balance across chains (polygon, base, ethereum)
3. Click "send_payment" — watch balance decrease, transaction recorded
4. Click "call_x402_endpoint" — see the 402 payment required -> pay -> response flow

## 4. Session Path (MPP)

1. Click the "Session/MPP" tab
2. Click "create_payment_session" — creates a session with $25 budget
3. Click "send_payment" three times — watch the Session Monitor budget bar decrease
4. Click "get_session_status" — see remaining budget, payment count, expiry
5. The Session Monitor panel updates automatically after each action

## 5. Fiat Path

1. Click the "Fiat/Card" tab
2. Click "send_payment" — see card authorization, capture, and settlement flow
3. Note: UPI is not available (requires PSP license in India)

## 6. Collections (works on all providers)

1. Click "create_invoice" — a new invoice appears in the Invoice Dashboard
2. Switch to a different provider tab, then click "pay_invoice" — invoice status updates
3. This demonstrates the collections layer that works above all three payment rails

## 7. Connect Claude Desktop

Copy the config from `examples/claude-desktop-config.json` into your Claude Desktop settings. Then you can use the payment tools via natural language.

## What You're Seeing

All data is simulated (mock providers). In production, you'd swap the mock providers for real implementations:
- Stablecoin: actual on-chain USDC via x402 facilitators
- Session: real MPP session tokens with payment streaming
- Fiat: card processing via Stripe, bank transfers via your PSP
