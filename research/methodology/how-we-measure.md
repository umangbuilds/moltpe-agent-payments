# How We Measure

*Methodology notes for MoltPe Research reports. Last updated: March 2026.*

## Primary Sources

| Source | What it measures | How we use it |
|--------|-----------------|---------------|
| **Artemis Analytics** | On-chain transaction volume with wash trade filtering | Primary source for verified volume figures |
| **Allium Labs** | On-chain transaction volume, raw and filtered | Cross-check against Artemis |
| **Circle public reports** | Self-reported agent payment statistics | Noted as self-reported; compared against on-chain data |
| **x402.org dashboard** | Self-reported x402 ecosystem statistics | Noted as self-reported; not used for volume claims |
| **Company announcements** | Funding, partnerships, product launches | Used for competitive landscape; not volume claims |
| **GitHub / npm data** | Developer adoption signals (stars, downloads) | Used as proxy for developer mindshare, not commerce volume |

## How Wash Trades Are Filtered

Raw on-chain data overstates genuine commercial activity. We apply the following filters, consistent with Artemis Analytics methodology:

1. **Self-dealing:** Remove transactions where the sending wallet and receiving wallet belong to the same entity
2. **Wash trading:** Remove transactions that reverse within a short time window with no net value transfer
3. **Infrastructure testing:** Flag transactions with round-number amounts or sequential patterns typical of automated testing rather than commerce
4. **Known test addresses:** Remove transactions to/from addresses publicly identified as testnet or staging environments

After filtering, verified volume is typically 8–15x lower than self-reported figures for the current x402 ecosystem.

## Limitations

**On-chain analysis only captures stablecoin rails.** Fiat payments (cards, bank transfers) processed through ACP or MPP are not visible on-chain. Volume figures in this research cover USDC and other on-chain settlement only.

**Attribution is imperfect.** Not all on-chain USDC transfers are agent-initiated. We rely on Artemis and Allium categorization of "agent payment" transactions, which may miss some legitimate activity or include non-agent flows.

**Self-reported figures are unaudited.** Circle, Coinbase, x402.org, and other providers report their own figures without independent third-party verification. We note the source type clearly for each data point.

**Timing lag.** On-chain analysis reflects settlement data, not authorization. For protocols with delayed or batched settlement (MPP), on-chain data may understate real activity.

**Rapidly changing landscape.** The agent payments market is moving fast. Figures that were accurate at time of research may be outdated within weeks. All data points are dated.

## Update Frequency

Research reports are updated quarterly. Data files in this repository are updated when a new report is published. The report date is in the filename (e.g., `2026-03-market-landscape.md`).

## Chain Coverage

On-chain analysis covers the chains where verified agent payment activity exists:

- **Base** — most consistent legitimate x402 activity
- **Polygon PoS** — authentic growth trend
- **Solana** — high reported volume but 86% found artificial (as of January 2026)
- **Ethereum mainnet** — lower activity; higher gas costs limit micropayment viability

## Disclaimer

This research is provided for informational purposes only. It does not constitute financial, investment, or legal advice. Data is gathered from publicly available sources and may contain inaccuracies. MoltPe makes no representations about the completeness or accuracy of third-party data sources.
