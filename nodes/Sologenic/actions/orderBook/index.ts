/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { MarketDataClient } from '../../transport/marketDataClient';
import { XrplClient } from '../../transport/xrplClient';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['orderBook'],
      },
    },
    options: [
      {
        name: 'Get Order Book',
        value: 'getOrderBook',
        description: 'Get order book for a trading pair',
        action: 'Get order book',
      },
      {
        name: 'Get Best Bid/Ask',
        value: 'getBestBidAsk',
        description: 'Get best bid and ask prices',
        action: 'Get best bid ask',
      },
      {
        name: 'Get Spread',
        value: 'getSpread',
        description: 'Get bid-ask spread',
        action: 'Get spread',
      },
      {
        name: 'Get XRPL Order Book',
        value: 'getXrplOrderBook',
        description: 'Get order book directly from XRPL',
        action: 'Get XRPL order book',
      },
    ],
    default: 'getOrderBook',
  },
];

export const fields: INodeProperties[] = [
  {
    displayName: 'Symbol',
    name: 'symbol',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['orderBook'],
        operation: ['getOrderBook', 'getBestBidAsk', 'getSpread'],
      },
    },
    default: 'SOLO/XRP',
    description: 'Trading pair symbol (e.g., SOLO/XRP)',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['orderBook'],
        operation: ['getOrderBook', 'getXrplOrderBook'],
      },
    },
    default: 20,
    description: 'Maximum number of orders per side',
  },
  {
    displayName: 'Taker Gets Currency',
    name: 'takerGetsCurrency',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['orderBook'],
        operation: ['getXrplOrderBook'],
      },
    },
    default: 'XRP',
    description: 'Currency the taker receives',
  },
  {
    displayName: 'Taker Gets Issuer',
    name: 'takerGetsIssuer',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['orderBook'],
        operation: ['getXrplOrderBook'],
      },
    },
    default: '',
    description: 'Issuer for taker gets currency (leave empty for XRP)',
  },
  {
    displayName: 'Taker Pays Currency',
    name: 'takerPaysCurrency',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['orderBook'],
        operation: ['getXrplOrderBook'],
      },
    },
    default: 'SOLO',
    description: 'Currency the taker pays',
  },
  {
    displayName: 'Taker Pays Issuer',
    name: 'takerPaysIssuer',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['orderBook'],
        operation: ['getXrplOrderBook'],
      },
    },
    default: '',
    description: 'Issuer for taker pays currency (leave empty for XRP)',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;

  let result: unknown;

  if (operation === 'getXrplOrderBook') {
    const credentials = await this.getCredentials('sologenicNetwork');
    const client = XrplClient.fromCredentials({
      network: credentials.network as string,
      customWsUrl: credentials.customWsUrl as string | undefined,
    });

    try {
      await client.connect();

      const takerGetsCurrency = this.getNodeParameter('takerGetsCurrency', index) as string;
      const takerGetsIssuer = this.getNodeParameter('takerGetsIssuer', index) as string;
      const takerPaysCurrency = this.getNodeParameter('takerPaysCurrency', index) as string;
      const takerPaysIssuer = this.getNodeParameter('takerPaysIssuer', index) as string;
      const limit = this.getNodeParameter('limit', index) as number;

      const takerGets =
        takerGetsCurrency === 'XRP'
          ? { currency: 'XRP' }
          : { currency: takerGetsCurrency, issuer: takerGetsIssuer };

      const takerPays =
        takerPaysCurrency === 'XRP'
          ? { currency: 'XRP' }
          : { currency: takerPaysCurrency, issuer: takerPaysIssuer };

      result = await client.getOrderBook(
        takerGets as { currency: string; issuer?: string },
        takerPays as { currency: string; issuer?: string },
        limit,
      );
    } finally {
      await client.disconnect();
    }
  } else {
    const credentials = await this.getCredentials('sologenicApi');
    const client = new MarketDataClient({
      apiEndpoint: credentials.apiEndpoint as 'production' | 'sandbox' | 'custom',
      customApiUrl: credentials.customApiUrl as string | undefined,
      apiKey: credentials.apiKey as string | undefined,
    });

    switch (operation) {
      case 'getOrderBook': {
        const symbol = this.getNodeParameter('symbol', index) as string;
        const limit = this.getNodeParameter('limit', index) as number;
        result = await client.getMarketDepth(symbol, limit);
        break;
      }

      case 'getBestBidAsk': {
        const symbol = this.getNodeParameter('symbol', index) as string;
        const ticker = await client.getTicker(symbol);
        result = {
          symbol,
          bestBid: ticker.bid,
          bestAsk: ticker.ask,
          spread: ticker.ask - ticker.bid,
          spreadPercent: ((ticker.ask - ticker.bid) / ticker.ask) * 100,
        };
        break;
      }

      case 'getSpread': {
        const symbol = this.getNodeParameter('symbol', index) as string;
        result = await client.getSpread(symbol);
        break;
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  return [{ json: result as IDataObject }];
}
