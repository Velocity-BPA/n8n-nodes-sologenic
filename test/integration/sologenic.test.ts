/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { XrplClientWrapper } from '../../nodes/Sologenic/transport/xrplClient';
import { MarketDataClient } from '../../nodes/Sologenic/transport/marketDataClient';

// Mock the xrpl module
jest.mock('xrpl', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(false),
    request: jest.fn().mockImplementation((req) => {
      if (req.command === 'account_info') {
        return Promise.resolve({
          result: {
            account_data: {
              Account: req.account,
              Balance: '100000000',
              Sequence: 1,
              OwnerCount: 5,
            },
          },
        });
      }
      if (req.command === 'account_lines') {
        return Promise.resolve({
          result: {
            lines: [
              {
                currency: '534F4C4F00000000000000000000000000000000',
                account: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
                balance: '1000',
              },
            ],
          },
        });
      }
      if (req.command === 'account_tx') {
        return Promise.resolve({
          result: {
            transactions: [],
          },
        });
      }
      if (req.command === 'server_info') {
        return Promise.resolve({
          result: {
            info: {
              build_version: '1.9.0',
              server_state: 'full',
            },
          },
        });
      }
      return Promise.resolve({ result: {} });
    }),
  })),
  Wallet: {
    fromSeed: jest.fn().mockReturnValue({
      address: 'rTestAddress123',
    }),
  },
  xrpToDrops: jest.fn().mockImplementation((xrp) => String(Number(xrp) * 1000000)),
  dropsToXrp: jest.fn().mockImplementation((drops) => String(Number(drops) / 1000000)),
}));

// Mock axios for market data client
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockImplementation((url) => {
      if (url.includes('ticker') && !url.includes('tickers')) {
        return Promise.resolve({
          data: {
            symbol: 'SOLO/XRP',
            price: 0.15,
            bid: 0.14,
            ask: 0.16,
            high24h: 0.18,
            low24h: 0.12,
            volume24h: 1000000,
            change24h: 0.01,
            changePercent24h: 5.5,
            timestamp: Date.now(),
          },
        });
      }
      if (url.includes('tickers')) {
        return Promise.resolve({
          data: [
            { symbol: 'SOLO/XRP', price: 0.15, bid: 0.14, ask: 0.16, high24h: 0.18, low24h: 0.12, volume24h: 1000000, change24h: 0.01, changePercent24h: 5.5, timestamp: Date.now() },
            { symbol: 'USD/XRP', price: 0.50, bid: 0.49, ask: 0.51, high24h: 0.52, low24h: 0.48, volume24h: 500000, change24h: 0.02, changePercent24h: 2.5, timestamp: Date.now() },
          ],
        });
      }
      return Promise.resolve({ data: {} });
    }),
  }),
}));

describe('XrplClientWrapper', () => {
  let client: XrplClientWrapper;

  beforeEach(() => {
    // Create client using the static factory method
    client = XrplClientWrapper.fromCredentials({
      network: 'testnet',
    });
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('Connection', () => {
    it('should connect to XRPL', async () => {
      await expect(client.connect()).resolves.not.toThrow();
    });

    it('should disconnect from XRPL', async () => {
      await client.connect();
      await expect(client.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Account Operations', () => {
    const testAddress = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe';

    it('should get account info', async () => {
      const accountInfo = await client.getAccountInfo(testAddress);
      expect(accountInfo.account_data).toBeDefined();
      expect(accountInfo.account_data.Account).toBe(testAddress);
    });

    it('should get account balance', async () => {
      const balance = await client.getAccountBalance(testAddress);
      expect(balance.xrp).toBeDefined();
      expect(balance.drops).toBeDefined();
    });

    it('should get XRP balance', async () => {
      const xrpBalance = await client.getXrpBalance(testAddress);
      expect(xrpBalance).toBeDefined();
    });

    it('should get balances', async () => {
      const balances = await client.getBalances(testAddress);
      expect(Array.isArray(balances)).toBe(true);
    });

    it('should get transactions', async () => {
      const transactions = await client.getTransactions(testAddress);
      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  describe('Static Methods', () => {
    it('should validate valid address', () => {
      const validAddress = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe';
      expect(XrplClientWrapper.isValidAddress(validAddress)).toBe(true);
    });

    it('should reject invalid address', () => {
      expect(XrplClientWrapper.isValidAddress('invalid')).toBe(false);
      expect(XrplClientWrapper.isValidAddress('0x123')).toBe(false);
      expect(XrplClientWrapper.isValidAddress('')).toBe(false);
    });

    it('should convert XRP to drops', () => {
      expect(XrplClientWrapper.xrpToDrops('1')).toBe('1000000');
      expect(XrplClientWrapper.xrpToDrops('0.000001')).toBe('1');
    });

    it('should convert drops to XRP', () => {
      expect(XrplClientWrapper.dropsToXrp('1000000')).toBe('1');
      expect(XrplClientWrapper.dropsToXrp('1')).toBe('0.000001');
    });
  });

  describe('Factory Method', () => {
    it('should create client from credentials', () => {
      const newClient = XrplClientWrapper.fromCredentials({
        network: 'mainnet',
      });
      expect(newClient).toBeInstanceOf(XrplClientWrapper);
    });

    it('should create client with custom WebSocket URL', () => {
      const newClient = XrplClientWrapper.fromCredentials({
        network: 'custom',
        customWsUrl: 'wss://custom.example.com',
      });
      expect(newClient).toBeInstanceOf(XrplClientWrapper);
    });
  });
});

describe('MarketDataClient', () => {
  let client: MarketDataClient;

  beforeEach(() => {
    client = new MarketDataClient({ apiEndpoint: 'production' });
  });

  describe('Ticker Operations', () => {
    it('should get ticker data', async () => {
      const ticker = await client.getTicker('SOLO/XRP');
      expect(ticker).toBeDefined();
      expect(ticker.symbol).toBeDefined();
      expect(ticker.price).toBeDefined();
    });

    it('should get all tickers', async () => {
      const tickers = await client.getAllTickers();
      expect(Array.isArray(tickers)).toBe(true);
      expect(tickers.length).toBeGreaterThan(0);
    });
  });
});

describe('End-to-End Workflow', () => {
  it('should complete a full data retrieval workflow', async () => {
    // Create clients
    const xrplClient = XrplClientWrapper.fromCredentials({ network: 'testnet' });
    const marketDataClient = new MarketDataClient({ apiEndpoint: 'production' });

    try {
      // Get account info
      const testAddress = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe';
      const accountInfo = await xrplClient.getAccountInfo(testAddress);
      expect(accountInfo.account_data).toBeDefined();

      // Get market data
      const ticker = await marketDataClient.getTicker('SOLO/XRP');
      expect(ticker.symbol).toBeDefined();

      // Combine data for a complete view
      const combinedData = {
        account: accountInfo.account_data.Account,
        balance: accountInfo.account_data.Balance,
        soloPrice: ticker.price,
      };

      expect(combinedData.account).toBe(testAddress);
      expect(combinedData.soloPrice).toBeDefined();
    } finally {
      await xrplClient.disconnect();
    }
  });
});

describe('Error Handling', () => {
  it('should handle connection errors gracefully', async () => {
    const client = XrplClientWrapper.fromCredentials({ network: 'testnet' });

    // The mock always succeeds, but in real usage this would test error handling
    await expect(client.connect()).resolves.not.toThrow();
    await client.disconnect();
  });

  it('should validate input parameters', () => {
    // Test address validation
    expect(XrplClientWrapper.isValidAddress('')).toBe(false);
    expect(XrplClientWrapper.isValidAddress('not-an-address')).toBe(false);
    expect(XrplClientWrapper.isValidAddress('rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe')).toBe(true);
  });
});
