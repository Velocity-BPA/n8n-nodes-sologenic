# n8n-nodes-sologenic

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for the Sologenic ecosystem on the XRP Ledger (XRPL). This node provides seamless integration with Sologenic's DEX, tokenized assets (stocks, ETFs, commodities), NFT marketplace, and SOLO token staking capabilities.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![XRPL](https://img.shields.io/badge/XRPL-blockchain-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

## Features

- **Account Management**: Get balance, account info, trustlines, and transaction history
- **SOLO Token**: Transfer, get balance, price data, market information, and staking info
- **DEX Trading**: Place and cancel orders, view order history, get trading pairs
- **Market Data**: Price tickers, OHLCV candlestick data, top gainers/losers
- **Order Book**: Real-time order book data, best bid/ask, spread calculations
- **Tokenized Assets**: Access stocks, ETFs, and commodities on XRPL
- **NFT Marketplace**: Browse collections and NFT details
- **Staking**: View staking pools, staked balances, and rewards
- **Trigger Node**: Monitor balance changes, price alerts, and transactions

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Select **Install**
4. Enter `n8n-nodes-sologenic`
5. Agree to the risks and click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-sologenic
```

### Development Installation

```bash
# Clone or extract the package
unzip n8n-nodes-sologenic.zip
cd n8n-nodes-sologenic

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes directory
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-sologenic

# Restart n8n
n8n start
```

## Credentials Setup

### Sologenic Network Credentials

Used for XRPL blockchain operations (account info, balances, transactions).

| Field | Description |
|-------|-------------|
| Network | Select XRPL network (Mainnet, Testnet, Devnet, Custom) |
| Custom WebSocket URL | Required if using Custom network |
| Wallet Address | Your XRPL wallet address (optional) |
| Wallet Secret | Your wallet secret for signing transactions (optional) |

### Sologenic API Credentials

Used for Sologenic platform API operations (market data, assets, NFTs).

| Field | Description |
|-------|-------------|
| API Endpoint | Select Production, Sandbox, or Custom |
| Custom API URL | Required if using Custom endpoint |
| API Key | Your Sologenic API key |
| API Secret | Your Sologenic API secret |

### Sologenic DEX Credentials

Used for DEX trading operations.

| Field | Description |
|-------|-------------|
| DEX Environment | Select Production, Testnet, or Custom |
| Custom DEX URL | Required if using Custom environment |
| Trading API Key | Your DEX trading API key |
| Wallet Address | Your trading wallet address |

## Resources & Operations

### Account
- **Get Balance**: Get XRP or token balance for an address
- **Get Info**: Get detailed account information
- **Get Trustlines**: List all trustlines for an account
- **Get Transactions**: Get transaction history

### SOLO Token
- **Get Balance**: Get SOLO token balance
- **Get Price**: Get current SOLO price
- **Get Market Data**: Get SOLO market statistics
- **Get Staking Info**: Get SOLO staking information
- **Transfer**: Send SOLO tokens (requires wallet credentials)

### DEX
- **Place Order**: Create buy/sell orders
- **Cancel Order**: Cancel an open order
- **Cancel All Orders**: Cancel all open orders
- **Get Order**: Get specific order details
- **Get Open Orders**: List all open orders
- **Get Order History**: Get order history
- **Get Trade History**: Get trade history
- **Get Trading Pairs**: List available trading pairs

### Market
- **Get Ticker**: Get price ticker for a trading pair
- **Get All Tickers**: Get all available tickers
- **Get OHLCV**: Get candlestick data
- **Get Top Gainers**: Get top gaining assets
- **Get Top Losers**: Get top losing assets

### Order Book
- **Get Order Book**: Get order book for a trading pair
- **Get Best Bid/Ask**: Get best bid and ask prices
- **Get Spread**: Get bid-ask spread
- **Get XRPL Order Book**: Get order book directly from XRPL

### Tokenized Assets
- **Get Assets**: List tokenized assets
- **Get Asset**: Get specific asset details
- **Search Assets**: Search for assets

### NFT
- **Get Collections**: List NFT collections
- **Get Collection**: Get collection details
- **Get Collection NFTs**: List NFTs in a collection
- **Get NFT**: Get specific NFT details

### Staking
- **Get Staking Info**: Get overall staking information
- **Get Staking Pools**: List available staking pools
- **Get Staked Balance**: Get staked balance for an address
- **Get Rewards**: Get staking rewards

## Trigger Node

The Sologenic Trigger node monitors for events and triggers workflows automatically.

### Trigger Types

| Type | Description |
|------|-------------|
| Balance Changed | Triggers when account balance changes |
| Price Alert | Triggers when price crosses a threshold |
| Transaction Received | Triggers when account receives a transaction |

## Usage Examples

### Get Account Balance

```javascript
// Configuration
{
  "resource": "account",
  "operation": "getBalance",
  "address": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
}
```

### Place a Limit Order

```javascript
// Configuration
{
  "resource": "dex",
  "operation": "placeOrder",
  "symbol": "SOLO/XRP",
  "side": "buy",
  "type": "limit",
  "amount": "100",
  "price": "0.15"
}
```

### Monitor Price Alerts

```javascript
// Trigger Configuration
{
  "triggerType": "priceAlert",
  "symbol": "SOLO/XRP",
  "alertType": "above",
  "threshold": 0.20
}
```

## XRPL Concepts

### Drops and XRP
- 1 XRP = 1,000,000 drops
- The node handles conversion automatically

### Trustlines
- Required to hold tokens other than XRP
- Can be set up through the Account resource

### Reserves
- Base reserve: 10 XRP
- Owner reserve: 2 XRP per owned object (trustlines, offers, etc.)

## Networks

| Network | WebSocket URL | Description |
|---------|--------------|-------------|
| Mainnet | wss://xrplcluster.com | Production network |
| Testnet | wss://s.altnet.rippletest.net:51233 | Test network with test XRP |
| Devnet | wss://s.devnet.rippletest.net:51233 | Development network |

## Error Handling

The node provides detailed error messages for common issues:

- **actNotFound**: Account does not exist on the network
- **tecUNFUNDED**: Insufficient balance for transaction
- **tecNO_LINE**: No trustline exists for the token
- **Invalid credentials**: Check your API keys and secrets

## Security Best Practices

1. **Never share wallet secrets** - Keep them secure and use environment variables
2. **Use testnet for development** - Test workflows before mainnet deployment
3. **Set appropriate trustline limits** - Don't set unlimited limits
4. **Monitor transactions** - Use triggers to track account activity
5. **Secure API keys** - Rotate keys regularly and use minimal permissions

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Watch mode for development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please ensure all contributions comply with the BSL 1.1 license.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

- **Documentation**: [velobpa.com/docs](https://velobpa.com/docs)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-sologenic/issues)
- **Email**: support@velobpa.com

## Acknowledgments

- [Sologenic](https://sologenic.com) - Tokenized assets on XRPL
- [XRPL](https://xrpl.org) - XRP Ledger
- [n8n](https://n8n.io) - Workflow automation platform
