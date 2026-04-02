/**
 * Copyright (c) 2026 Velocity BPA
 * Licensed under the Business Source License 1.1
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Sologenic } from '../nodes/Sologenic/Sologenic.node';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
  ...jest.requireActual('n8n-workflow'),
  NodeApiError: class NodeApiError extends Error {
    constructor(node: any, error: any) { super(error.message || 'API Error'); }
  },
  NodeOperationError: class NodeOperationError extends Error {
    constructor(node: any, message: string) { super(message); }
  },
}));

describe('Sologenic Node', () => {
  let node: Sologenic;

  beforeAll(() => {
    node = new Sologenic();
  });

  describe('Node Definition', () => {
    it('should have correct basic properties', () => {
      expect(node.description.displayName).toBe('Sologenic');
      expect(node.description.name).toBe('sologenic');
      expect(node.description.version).toBe(1);
      expect(node.description.inputs).toContain('main');
      expect(node.description.outputs).toContain('main');
    });

    it('should define 5 resources', () => {
      const resourceProp = node.description.properties.find(
        (p: any) => p.name === 'resource'
      );
      expect(resourceProp).toBeDefined();
      expect(resourceProp!.type).toBe('options');
      expect(resourceProp!.options).toHaveLength(5);
    });

    it('should have operation dropdowns for each resource', () => {
      const operations = node.description.properties.filter(
        (p: any) => p.name === 'operation'
      );
      expect(operations.length).toBe(5);
    });

    it('should require credentials', () => {
      expect(node.description.credentials).toBeDefined();
      expect(node.description.credentials!.length).toBeGreaterThan(0);
      expect(node.description.credentials![0].required).toBe(true);
    });

    it('should have parameters with proper displayOptions', () => {
      const params = node.description.properties.filter(
        (p: any) => p.displayOptions?.show?.resource
      );
      for (const param of params) {
        expect(param.displayOptions.show.resource).toBeDefined();
        expect(Array.isArray(param.displayOptions.show.resource)).toBe(true);
      }
    });
  });

  // Resource-specific tests
describe('Market Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-key', baseUrl: 'https://api.sologenic.org/v2' }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { httpRequest: jest.fn(), requestWithAuthentication: jest.fn() },
    };
  });

  it('should get all markets successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getMarkets')
      .mockReturnValueOnce('XRP')
      .mockReturnValueOnce('USD')
      .mockReturnValueOnce('active');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValueOnce({ markets: [] });

    const result = await executeMarketOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toEqual([{ json: { markets: [] }, pairedItem: { item: 0 } }]);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.sologenic.org/v2/markets?base=XRP&quote=USD&status=active',
      headers: {
        'Authorization': 'Bearer test-key',
        'Content-Type': 'application/json'
      },
      json: true
    });
  });

  it('should get specific market successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getMarket')
      .mockReturnValueOnce('XRP_USD');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValueOnce({ market: { id: 'XRP_USD' } });

    const result = await executeMarketOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toEqual([{ json: { market: { id: 'XRP_USD' } }, pairedItem: { item: 0 } }]);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.sologenic.org/v2/markets/XRP_USD',
      headers: {
        'Authorization': 'Bearer test-key',
        'Content-Type': 'application/json'
      },
      json: true
    });
  });

  it('should get market ticker successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getMarketTicker')
      .mockReturnValueOnce('XRP_USD');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValueOnce({ ticker: { price: '0.50' } });

    const result = await executeMarketOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toEqual([{ json: { ticker: { price: '0.50' } }, pairedItem: { item: 0 } }]);
  });

  it('should get orderbook successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getOrderbook')
      .mockReturnValueOnce('XRP_USD')
      .mockReturnValueOnce(100);
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValueOnce({ orderbook: { bids: [], asks: [] } });

    const result = await executeMarketOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toEqual([{ json: { orderbook: { bids: [], asks: [] } }, pairedItem: { item: 0 } }]);
  });

  it('should get market trades successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getMarketTrades')
      .mockReturnValueOnce('XRP_USD')
      .mockReturnValueOnce(50);
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValueOnce({ trades: [] });

    const result = await executeMarketOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toEqual([{ json: { trades: [] }, pairedItem: { item: 0 } }]);
  });

  it('should get market candles successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getMarketCandles')
      .mockReturnValueOnce('XRP_USD')
      .mockReturnValueOnce('1h')
      .mockReturnValueOnce('2023-01-01T00:00:00Z')
      .mockReturnValueOnce('2023-01-02T00:00:00Z');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValueOnce({ candles: [] });

    const result = await executeMarketOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toEqual([{ json: { candles: [] }, pairedItem: { item: 0 } }]);
  });

  it('should handle API errors', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getMarkets');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValueOnce(new Error('API Error'));

    await expect(executeMarketOperations.call(mockExecuteFunctions, [{ json: {} }])).rejects.toThrow('API Error');
  });

  it('should continue on fail when configured', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getMarkets');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValueOnce(new Error('API Error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executeMarketOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toEqual([{ json: { error: 'API Error' }, pairedItem: { item: 0 } }]);
  });
});

describe('Token Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.sologenic.org/v2'
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn()
      },
    };
  });

  describe('getTokens operation', () => {
    it('should successfully get tokens list', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        switch (param) {
          case 'operation': return 'getTokens';
          case 'search': return 'XRP';
          case 'limit': return 10;
          case 'offset': return 0;
          default: return undefined;
        }
      });

      const mockResponse = { data: [{ id: 'xrp', name: 'XRP' }] };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeTokenOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.sologenic.org/v2/tokens?search=XRP&limit=10&offset=0',
        headers: {
          'X-API-Key': 'test-api-key',
          'Content-Type': 'application/json',
        },
        json: true,
      });
    });

    it('should handle errors in getTokens', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'getTokens';
        return undefined;
      });
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

      await expect(executeTokenOperations.call(mockExecuteFunctions, [{ json: {} }])).rejects.toThrow('API Error');
    });
  });

  describe('getToken operation', () => {
    it('should successfully get specific token', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        switch (param) {
          case 'operation': return 'getToken';
          case 'tokenId': return 'xrp';
          default: return undefined;
        }
      });

      const mockResponse = { id: 'xrp', name: 'XRP', symbol: 'XRP' };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeTokenOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });

  describe('getTokenPrice operation', () => {
    it('should successfully get token price', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        switch (param) {
          case 'operation': return 'getTokenPrice';
          case 'tokenId': return 'xrp';
          case 'vsCurrency': return 'usd';
          default: return undefined;
        }
      });

      const mockResponse = { price: 0.5, currency: 'usd' };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeTokenOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });

  describe('getSoloTokenInfo operation', () => {
    it('should successfully get SOLO token info', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'getSoloTokenInfo';
        return undefined;
      });

      const mockResponse = { id: 'solo', name: 'Solo', totalSupply: '100000000' };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeTokenOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });
});

describe('Order Resource', () => {
	let mockExecuteFunctions: any;

	beforeEach(() => {
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				apiKey: 'test-key',
				baseUrl: 'https://api.sologenic.org/v2',
			}),
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
			helpers: {
				httpRequest: jest.fn(),
				requestWithAuthentication: jest.fn(),
			},
		};
	});

	it('should create order successfully', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('createOrder')
			.mockReturnValueOnce('BTC/XRP')
			.mockReturnValueOnce('buy')
			.mockReturnValueOnce('limit')
			.mockReturnValueOnce(100)
			.mockReturnValueOnce(0.5)
			.mockReturnValueOnce('rXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

		const mockResponse = { order_id: '12345', status: 'pending' };
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

		const result = await executeOrderOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: 'https://api.sologenic.org/v2/orders',
			headers: {
				'Authorization': 'Bearer test-key',
				'Content-Type': 'application/json',
			},
			body: {
				market: 'BTC/XRP',
				side: 'buy',
				type: 'limit',
				amount: 100,
				price: 0.5,
				wallet_address: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
			},
			json: true,
		});
	});

	it('should get orders successfully', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getOrders')
			.mockReturnValueOnce('BTC/XRP')
			.mockReturnValueOnce('open')
			.mockReturnValueOnce(50)
			.mockReturnValueOnce(0);

		const mockResponse = { orders: [{ order_id: '12345', status: 'open' }] };
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

		const result = await executeOrderOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
	});

	it('should get specific order successfully', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getOrder')
			.mockReturnValueOnce('12345');

		const mockResponse = { order_id: '12345', status: 'filled', amount: 100 };
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

		const result = await executeOrderOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: 'https://api.sologenic.org/v2/orders/12345',
			headers: {
				'Authorization': 'Bearer test-key',
			},
			json: true,
		});
	});

	it('should handle errors when continuing on fail', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getOrder');
		mockExecuteFunctions.continueOnFail.mockReturnValue(true);
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

		const result = await executeOrderOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(result).toEqual([{ json: { error: 'API Error' }, pairedItem: { item: 0 } }]);
	});

	it('should throw error when not continuing on fail', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getOrder');
		mockExecuteFunctions.continueOnFail.mockReturnValue(false);
		const error = new Error('API Error');
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(error);

		await expect(executeOrderOperations.call(mockExecuteFunctions, [{ json: {} }])).rejects.toThrow('API Error');
	});
});

describe('Nft Resource', () => {
  let mockExecuteFunctions: any;
  
  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        apiKey: 'test-key', 
        baseUrl: 'https://api.sologenic.org/v2' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn() 
      },
    };
  });

  it('should get NFTs successfully', async () => {
    const mockResponse = { data: [{ id: 'nft123', name: 'Test NFT' }] };
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getNfts')
      .mockReturnValueOnce('collection123')
      .mockReturnValueOnce('rOwnerAddress')
      .mockReturnValueOnce('for_sale')
      .mockReturnValueOnce(20)
      .mockReturnValueOnce(0);

    const result = await executeNftOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.sologenic.org/v2/nfts?collection=collection123&owner=rOwnerAddress&status=for_sale&limit=20&offset=0',
      headers: {
        'Authorization': 'Bearer test-key',
        'Content-Type': 'application/json',
      },
      json: true,
    });
  });

  it('should get specific NFT successfully', async () => {
    const mockResponse = { id: 'nft123', name: 'Test NFT', price: '100' };
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getNft')
      .mockReturnValueOnce('nft123');

    const result = await executeNftOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.sologenic.org/v2/nfts/nft123',
      headers: {
        'Authorization': 'Bearer test-key',
        'Content-Type': 'application/json',
      },
      json: true,
    });
  });

  it('should create NFT successfully', async () => {
    const mockResponse = { id: 'nft456', status: 'minted' };
    const metadata = { name: 'New NFT', description: 'Test NFT' };
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('createNft')
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce('collection123')
      .mockReturnValueOnce('rWalletAddress');

    const result = await executeNftOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://api.sologenic.org/v2/nfts',
      headers: {
        'Authorization': 'Bearer test-key',
        'Content-Type': 'application/json',
      },
      body: {
        metadata,
        collection: 'collection123',
        wallet_address: 'rWalletAddress',
      },
      json: true,
    });
  });

  it('should handle errors gracefully when continueOnFail is true', async () => {
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getNfts');

    const result = await executeNftOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result[0].json.error).toBe('API Error');
  });

  it('should throw error when continueOnFail is false', async () => {
    mockExecuteFunctions.continueOnFail.mockReturnValue(false);
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getNfts');

    await expect(executeNftOperations.call(mockExecuteFunctions, [{ json: {} }]))
      .rejects.toThrow('API Error');
  });
});

describe('Account Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.sologenic.org/v2',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  describe('getAccount operation', () => {
    it('should get account information successfully', async () => {
      const mockResponse = {
        address: 'rTest123',
        balance: '1000',
        sequence: 123,
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'getAccount';
        if (param === 'address') return 'rTest123';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
    });

    it('should handle getAccount errors', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'getAccount';
        if (param === 'address') return 'rTest123';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Account not found'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      const result = await executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json.error).toBe('Account not found');
    });
  });

  describe('getAccountBalances operation', () => {
    it('should get account balances successfully', async () => {
      const mockResponse = {
        balances: [
          { currency: 'XRP', value: '1000' },
          { currency: 'SOLO', value: '500' },
        ],
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'getAccountBalances';
        if (param === 'address') return 'rTest123';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
    });
  });

  describe('getAccountTransactions operation', () => {
    it('should get account transactions successfully', async () => {
      const mockResponse = {
        transactions: [
          { hash: 'tx123', type: 'payment', amount: '100' },
        ],
        total: 1,
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'getAccountTransactions';
        if (param === 'address') return 'rTest123';
        if (param === 'limit') return 50;
        if (param === 'offset') return 0;
        if (param === 'type') return 'payment';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
    });
  });

  describe('validateAccount operation', () => {
    it('should validate account successfully', async () => {
      const mockResponse = {
        valid: true,
        address: 'rTest123',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'validateAccount';
        if (param === 'address') return 'rTest123';
        if (param === 'signature') return 'test-signature';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
    });
  });
});
});
