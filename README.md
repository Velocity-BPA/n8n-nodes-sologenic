# n8n-nodes-sologenic

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

This n8n community node provides comprehensive integration with Sologenic's decentralized exchange and NFT marketplace. With 5 core resources (Market, Token, Order, NFT, Account), it enables seamless automation of trading operations, token management, order execution, NFT transactions, and account monitoring on the XRPL-based Sologenic ecosystem.

![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![XRPL](https://img.shields.io/badge/XRPL-Compatible-green)
![DeFi](https://img.shields.io/badge/DeFi-Trading-orange)
![NFT](https://img.shields.io/badge/NFT-Marketplace-purple)

## Features

- **Market Data Access** - Real-time price feeds, trading pairs, and market statistics
- **Token Management** - Comprehensive token operations including transfers and balance queries
- **Order Execution** - Create, modify, cancel, and monitor trading orders
- **NFT Operations** - Mint, transfer, and manage NFT collections on Sologenic
- **Account Monitoring** - Track balances, transaction history, and account activities
- **XRPL Integration** - Native support for XRP Ledger ecosystem transactions
- **Real-time Updates** - Live market data and order status monitoring
- **Comprehensive Error Handling** - Detailed error responses and retry mechanisms

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-sologenic`
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-sologenic
```

### Development Installation

```bash
git clone https://github.com/Velocity-BPA/n8n-nodes-sologenic.git
cd n8n-nodes-sologenic
npm install
npm run build
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-sologenic
n8n start
```

## Credentials Setup

| Field | Description | Required |
|-------|-------------|----------|
| API Key | Your Sologenic API key from the developer dashboard | Yes |
| Environment | Production or Testnet environment | Yes |
| Wallet Address | Your XRPL wallet address for transaction signing | Yes |
| Private Key | Your wallet's private key (encrypted storage) | Yes |

## Resources & Operations

### 1. Market

| Operation | Description |
|-----------|-------------|
| Get Market Data | Retrieve real-time market data for trading pairs |
| List Trading Pairs | Get all available trading pairs on Sologenic |
| Get Order Book | Fetch current order book for a specific pair |
| Get Trade History | Retrieve recent trade history for market analysis |
| Get Market Statistics | Access 24h volume, price changes, and trends |

### 2. Token

| Operation | Description |
|-----------|-------------|
| Get Token Info | Retrieve detailed information about a specific token |
| List Tokens | Get all available tokens on the Sologenic platform |
| Transfer Token | Send tokens between XRPL addresses |
| Get Balance | Check token balance for a specific address |
| Get Transaction History | Retrieve token transaction history |

### 3. Order

| Operation | Description |
|-----------|-------------|
| Create Order | Place a new buy or sell order |
| Cancel Order | Cancel an existing open order |
| Modify Order | Update price or quantity of an existing order |
| Get Order Status | Check the current status of a specific order |
| List Orders | Retrieve all orders for the authenticated account |
| Get Order History | Access historical order data and execution details |

### 4. Nft

| Operation | Description |
|-----------|-------------|
| Mint NFT | Create a new NFT on the Sologenic platform |
| Transfer NFT | Send NFT to another XRPL address |
| Get NFT Details | Retrieve metadata and ownership information |
| List NFTs | Get NFT collections and individual tokens |
| Set NFT Price | List NFT for sale at specified price |
| Cancel NFT Sale | Remove NFT from marketplace |

### 5. Account

| Operation | Description |
|-----------|-------------|
| Get Account Info | Retrieve account details and verification status |
| Get Balance Summary | Access complete balance overview across all assets |
| Get Transaction History | Comprehensive transaction log with filtering |
| Update Account Settings | Modify account preferences and notifications |
| Get Trading Statistics | Personal trading metrics and performance data |

## Usage Examples

```javascript
// Get real-time market data for SOLO/XRP pair
{
  "pair": "SOLO/XRP",
  "interval": "1h",
  "limit": 100
}
```

```javascript
// Create a limit buy order
{
  "pair": "SOLO/XRP",
  "side": "buy",
  "type": "limit",
  "amount": "1000",
  "price": "0.000125"
}
```

```javascript
// Transfer SOLO tokens
{
  "currency": "SOLO",
  "amount": "500",
  "destination": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
  "memo": "Payment for services"
}
```

```javascript
// Mint new NFT
{
  "name": "Digital Artwork #001",
  "description": "Exclusive digital collectible",
  "image_url": "https://example.com/artwork.jpg",
  "royalty_percentage": 5
}
```

## Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| Invalid API Key | Authentication failed with provided credentials | Verify API key in Sologenic developer dashboard |
| Insufficient Balance | Not enough funds for transaction or order | Check account balance and deposit required funds |
| Order Not Found | Specified order ID does not exist | Verify order ID and check if order was already executed |
| Rate Limit Exceeded | Too many requests within time window | Implement exponential backoff retry strategy |
| Network Timeout | XRPL network connection timeout | Retry operation with longer timeout values |
| Invalid Trading Pair | Specified trading pair is not supported | Check available trading pairs using List Trading Pairs |

## Development

```bash
npm install
npm run build
npm test
npm run lint
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
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please ensure:

1. Code follows existing style conventions
2. All tests pass (`npm test`)
3. Linting passes (`npm run lint`)
4. Documentation is updated for new features
5. Commit messages are descriptive

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-sologenic/issues)
- **Sologenic API Documentation**: [docs.sologenic.com](https://docs.sologenic.com)
- **XRPL Developer Resources**: [xrpl.org/docs](https://xrpl.org/docs)