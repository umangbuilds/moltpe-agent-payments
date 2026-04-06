# Protocol Comparison: Same Task, Three Ways

**Task:** Agent Alice needs to pay for 5 API calls at $0.50 each.

## Path A: Stablecoin (x402)

Each API call is an independent x402 transaction.

```
Call 1: POST /api/data → 402 Payment Required → Pay 0.50 USDC on Base → 200 OK
Call 2: POST /api/data → 402 Payment Required → Pay 0.50 USDC on Base → 200 OK
Call 3: POST /api/data → 402 Payment Required → Pay 0.50 USDC on Base → 200 OK
Call 4: POST /api/data → 402 Payment Required → Pay 0.50 USDC on Base → 200 OK
Call 5: POST /api/data → 402 Payment Required → Pay 0.50 USDC on Base → 200 OK
```

**Total:** 5 on-chain transactions, $2.50 in USDC
**Settlement:** Immediate (on-chain finality)
**Best when:** Each call is to a different provider, or you want per-request accounting

## Path B: Session (MPP)

One session authorization, then stream payments.

```
Create session: Budget $5 USD → Session ID returned
Call 1: Pay $0.50 within session → Remaining: $4.50
Call 2: Pay $0.50 within session → Remaining: $4.00
Call 3: Pay $0.50 within session → Remaining: $3.50
Call 4: Pay $0.50 within session → Remaining: $3.00
Call 5: Pay $0.50 within session → Remaining: $2.50
Close session: Refund $2.50 unused budget
```

**Total:** 1 authorization + 5 session payments, $2.50 spent
**Settlement:** Platform-mediated (sub-second)
**Best when:** Multiple calls to the same provider, or you want budget caps

## Path C: Fiat (Card)

One card authorization with capture.

```
Authorize: $2.50 on Visa ending 4242
Call 1-5: API calls proceed (pre-authorized)
Capture: $2.50 captured after all calls complete
Settlement: 1-2 business days
```

**Total:** 1 card authorization + 1 capture, $2.50
**Settlement:** 1-2 business days
**Best when:** Enterprise billing, existing card infrastructure, no crypto needed
