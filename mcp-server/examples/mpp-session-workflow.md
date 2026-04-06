# MPP Session Payment Workflow

Step-by-step example of creating and using an MPP payment session.

## Scenario

Agent Alice needs to make multiple API calls to a data service. Instead of paying per-request (x402 style), she creates a session with a $25 budget and streams payments as she works.

## Steps

### 1. Create a session

Tool: `create_payment_session`

```json
{
  "agentId": "agent-alice",
  "budget": 25,
  "currency": "USD",
  "description": "Data gathering for market research"
}
```

Response: session ID, $25 budget, 1-hour expiry.

### 2. Make payments within the session

Tool: `send_payment` (with sessionId)

```json
{
  "from": "agent-alice",
  "to": "data-api-1",
  "amount": 2,
  "sessionId": "session-xxx"
}
```

Repeat 5 times ($2 each = $10 spent).

### 3. Check session status

Tool: `get_session_status`

```json
{
  "sessionId": "session-xxx"
}
```

Response: budget $25, spent $10, remaining $15, 5 payments.

### 4. Make 3 more payments

Three more $2 payments = $6 more spent. Total: $16 spent, $9 remaining.

### 5. Close the session

The session closes automatically when it expires, or you can close it by calling the tool. The remaining $9 is refunded to the agent's balance.

Summary: budget $25, spent $16, refunded $9, 8 payments.

## Why use sessions instead of per-request?

- Lower latency: no per-payment authorization
- Budget caps: cannot overspend the authorized amount
- Simpler accounting: one authorization event, many payments
- Session summary: get a complete record when done
