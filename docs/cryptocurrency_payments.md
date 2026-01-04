# Cryptocurrency Payments

This document covers cryptocurrency payment integration with KillBill for self-hosted instances.

## Overview

CrowdChurn supports cryptocurrency payments through KillBill payment plugins. Unlike traditional payment processors (Stripe, PayPal, Braintree) which require USD for internal accounting, KillBill can use the instance's configurable base currency (`INSTANCE_BASE_CURRENCY`) for cryptocurrency transactions.

## Supported Cryptocurrencies

The following cryptocurrencies are configured in `config/currencies.json`:

| Currency | Symbol | Decimals | Subunit | Notes |
|----------|--------|----------|---------|-------|
| BTC | ₿ | 8 | satoshi | Bitcoin - most widely supported |
| ETH | Ξ | 18 | wei | Ethereum - supports ERC-20 tokens |
| LTC | Ł | 8 | litoshi | Litecoin - faster confirmations than BTC |
| XMR | ɱ | 12 | piconero | Monero - privacy-focused |
| USDT | ₮ | 6 | cent | Tether stablecoin |
| USDC | USDC | 6 | cent | USD Coin stablecoin |
| DAI | DAI | 18 | wei | Dai decentralized stablecoin |
| SOL | SOL | 9 | lamport | Solana - high throughput |
| DOGE | Ð | 8 | koinu | Dogecoin |
| MATIC | MATIC | 18 | wei | Polygon (Ethereum L2) |
| AVAX | AVAX | 18 | wei | Avalanche |
| DOT | DOT | 10 | planck | Polkadot |
| ADA | ADA | 6 | lovelace | Cardano |
| BNB | BNB | 18 | jager | BNB Chain |
| XRP | XRP | 6 | drop | Ripple |
| TRX | TRX | 6 | sun | Tron |

## Recommended KillBill Plugin: BTCPay Server

### Why BTCPay Server?

The official KillBill cryptocurrency plugins (killbill-bitcoin-plugin, killbill-bitpay-plugin, killbill-coinbase-plugin) were archived in October 2019 and are no longer maintained. We recommend integrating with **BTCPay Server** instead:

- **Self-hosted**: No third-party custody of funds
- **No fees**: No transaction, processing, or subscription fees
- **Privacy-focused**: No KYC requirements, no data sharing
- **Multi-currency**: Supports Bitcoin, Litecoin, and altcoins via plugins
- **Lightning Network**: Instant Bitcoin payments with near-zero fees
- **Active development**: Regularly updated with security patches

### BTCPay Server Setup

1. **Deploy BTCPay Server** (see [BTCPay Server Documentation](https://docs.btcpayserver.org/)):
   ```bash
   # Using Docker (recommended)
   git clone https://github.com/btcpayserver/btcpayserver-docker
   cd btcpayserver-docker
   export BTCPAY_HOST="btcpay.yourdomain.com"
   export NBITCOIN_NETWORK="mainnet"
   export BTCPAYGEN_CRYPTO1="btc"
   export BTCPAYGEN_LIGHTNING="clightning"
   . ./btcpay-setup.sh -i
   ```

2. **Configure pruned node** (reduces storage from 600GB+ to ~60GB):
   ```bash
   export BTCPAYGEN_ADDITIONAL_FRAGMENTS="opt-save-storage"
   ```

3. **Create a store** in BTCPay Server and generate an API key

4. **Create a KillBill payment plugin** that integrates with BTCPay Server's API

### KillBill Plugin Integration

Create a custom KillBill payment plugin that:

1. Implements the `PaymentPluginApi` interface
2. Calls BTCPay Server's Greenfield API for invoice creation
3. Handles webhook callbacks for payment confirmation
4. Maps BTCPay payment states to KillBill payment states

Example plugin configuration (`btcpay.yml`):
```yaml
:btcpay:
  :server_url: 'https://btcpay.yourdomain.com'
  :api_key: 'your-api-key'
  :store_id: 'your-store-id'
  :webhook_secret: 'your-webhook-secret'
  # Confirmation thresholds (see below)
  :btc_confirmations: 1
  :ltc_confirmations: 6
  :eth_confirmations: 12
```

## Confirmation Thresholds

Cryptocurrency transactions require block confirmations before being considered final. The number of confirmations needed depends on the transaction value and risk tolerance.

### Recommended Confirmation Settings

| Cryptocurrency | Low Value (<$100) | Medium Value ($100-$1000) | High Value (>$1000) | Block Time |
|----------------|-------------------|---------------------------|---------------------|------------|
| BTC | 1 | 3 | 6 | ~10 min |
| ETH | 12 | 20 | 50 | ~12 sec |
| LTC | 6 | 12 | 24 | ~2.5 min |
| XMR | 10 | 10 | 10 | ~2 min |
| DOGE | 6 | 20 | 40 | ~1 min |
| SOL | 1 (finalized) | 1 (finalized) | 1 (finalized) | ~400 ms |
| DOT | finality | finality | finality | ~6 sec |
| ADA | 15 | 30 | 60 | ~20 sec |

### Zero-Confirmation (Zeroconf) Payments

For low-value transactions, some merchants accept zero-confirmation payments using transaction confidence metrics:

- **When to use**: Digital goods under $50, trusted customers
- **Risks**: Double-spend attacks (rare but possible)
- **Mitigations**:
  - Check transaction propagation across multiple nodes
  - Verify no conflicting transactions in mempool
  - Use Replace-By-Fee (RBF) detection
  - Set maximum order amount thresholds

**Warning**: Never use zeroconf for high-value transactions or physical goods that cannot be recalled.

### Finality vs Confirmations

Some blockchains use finality mechanisms instead of confirmation counts:

- **Solana**: Uses "finalized" commitment level (~32 slots, ~13 seconds)
- **Polkadot**: Uses GRANDPA finality (~12-60 seconds)
- **Ethereum (post-merge)**: Finality after 2 epochs (~13 minutes)

For these chains, wait for finality rather than counting confirmations.

## Exchange Rate Handling

### Rate Sources

Configure exchange rate providers in your BTCPay Server or KillBill plugin:

- **Recommended**: CoinGecko, Kraken, Bitstamp (reliable, free tier available)
- **Alternatives**: Coinbase, Binance, Bitfinex

### Rate Locking

To protect against volatility during checkout:

1. **Lock rate at invoice creation** for a fixed period (typically 15-30 minutes)
2. **Store the locked rate** with the purchase record
3. **Use the locked rate** for all calculations (affiliate cuts, refunds, etc.)

Example rate lock implementation:
```ruby
def lock_crypto_rate(currency_type, duration_minutes: 15)
  rate = get_rate(currency_type)
  lock_token = SecureRandom.uuid
  lock_key = "crypto_rate_lock_#{lock_token}"
  
  currency_namespace.setex(
    lock_key,
    duration_minutes * 60,
    { rate: rate, currency: currency_type, locked_at: Time.now }.to_json
  )
  
  { token: lock_token, rate: rate }
end
```

### FX Rate Drift

Affiliate calculations and refunds use the current exchange rate at calculation time, not the purchase-time rate. This is intentional:

- Currency rates are inherently variable (few fixed-rate pegs exist globally)
- Storing historical rates for every transaction adds complexity
- The drift is typically small for short time periods

For high-value transactions where rate drift is a concern, consider storing the purchase-time rate and using it for subsequent calculations.

## Refunds

Cryptocurrency refunds differ from traditional payment refunds:

### Key Differences

1. **No native reversal**: Blockchain transactions cannot be reversed by design
2. **New outbound transaction**: Refunds require creating a new transaction to the customer's wallet
3. **Net refunds**: Transaction fees from the original payment are NOT refunded (the customer paid network fees, not the merchant)
4. **Wallet address required**: Customer must provide a refund address (may differ from payment address)

### Refund Process

1. Customer requests refund and provides wallet address
2. Calculate refund amount in the original cryptocurrency
3. Optionally recalculate using current exchange rate (for fiat-denominated products)
4. Create outbound transaction via BTCPay Server or direct wallet integration
5. Wait for confirmation before marking refund complete

### Partial Refunds

For partial refunds, calculate the cryptocurrency amount based on:
- The original crypto amount paid, OR
- The fiat value at current exchange rates

Document your refund policy clearly to avoid disputes.

## Security Considerations

### Wallet Security

- Use **hardware wallets** (Ledger, Trezor) for hot wallet keys
- Implement **multi-signature** for high-value wallets
- Use **cold storage** for majority of funds
- Regular **key rotation** for API keys and webhooks

### Double-Spend Protection

- Wait for sufficient confirmations before delivering goods
- Monitor for transaction replacements (RBF)
- Use blockchain monitoring services for large transactions
- Implement velocity checks (unusual transaction patterns)

### Privacy

- Generate **new addresses** for each transaction
- Don't reuse addresses across customers
- Consider **Monero** for privacy-sensitive use cases
- Be aware of blockchain analysis capabilities

## Future Considerations

### Products as Smart Contracts

A future enhancement could support products where the crypto contract *is* the product being delivered:

- NFT minting upon purchase
- Token airdrops
- Smart contract access rights
- DAO membership tokens

This would require:
- Smart contract deployment infrastructure
- On-chain delivery verification
- Gas fee handling
- Multi-chain support

## References

- [BTCPay Server Documentation](https://docs.btcpayserver.org/)
- [BTCPay Server GitHub](https://github.com/btcpayserver/btcpayserver)
- [KillBill Payment Plugin Development](https://docs.killbill.io/latest/payment_plugin)
- [Bitcoin Confirmation Best Practices](https://bitcoin.org/en/you-need-to-know)
