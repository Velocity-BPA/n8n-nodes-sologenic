/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { MarketDataClient } from '../../transport/marketDataClient';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['market'],
      },
    },
    options: [
      {
        name: 'Get Ticker',
        value: 'getTicker',
        description: 'Get price ticker for a trading pair',
        action: 'Get ticker',
      },
      {
        name: 'Get All Tickers',
        value: 'getAllTickers',
        description: 'Get all available price tickers',
        action: 'Get all tickers',
      },
      {
        name: 'Get OHLCV',
        value: 'getOhlcv',
        description: 'Get OHLCV (candlestick) data',
        action: 'Get OHLCV data',
      },
      {
        name: 'Get Top Gainers',
        value: 'getTopGainers',
        description: 'Get top gaining assets',
        action: 'Get top gainers',
      },
      {
        name: 'Get Top Losers',
        value: 'getTopLosers',
        description: 'Get top losing assets',
        action: 'Get top losers',
      },
    ],
    default: 'getTicker',
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
        resource: ['market'],
        operation: ['getTicker', 'getOhlcv'],
      },
    },
    default: 'SOLO/XRP',
    description: 'Trading pair symbol (e.g., SOLO/XRP)',
  },
  {
    displayName: 'Interval',
    name: 'interval',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['market'],
        operation: ['getOhlcv'],
      },
    },
    options: [
      { name: '1 Minute', value: '1m' },
      { name: '5 Minutes', value: '5m' },
      { name: '15 Minutes', value: '15m' },
      { name: '1 Hour', value: '1h' },
      { name: '4 Hours', value: '4h' },
      { name: '1 Day', value: '1d' },
      { name: '1 Week', value: '1w' },
    ],
    default: '1h',
    description: 'Candlestick interval',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['market'],
        operation: ['getOhlcv', 'getTopGainers', 'getTopLosers'],
      },
    },
    default: 100,
    description: 'Maximum number of results to return',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const credentials = await this.getCredentials('sologenicApi');

  const client = new MarketDataClient({
    apiEndpoint: credentials.apiEndpoint as 'production' | 'sandbox' | 'custom',
    customApiUrl: credentials.customApiUrl as string | undefined,
    apiKey: credentials.apiKey as string | undefined,
  });

  let result: unknown;

  switch (operation) {
    case 'getTicker': {
      const symbol = this.getNodeParameter('symbol', index) as string;
      result = await client.getTicker(symbol);
      break;
    }

    case 'getAllTickers': {
      result = await client.getAllTickers();
      break;
    }

    case 'getOhlcv': {
      const symbol = this.getNodeParameter('symbol', index) as string;
      const interval = this.getNodeParameter('interval', index) as
        | '1m'
        | '5m'
        | '15m'
        | '1h'
        | '4h'
        | '1d'
        | '1w';
      const limit = this.getNodeParameter('limit', index) as number;
      result = await client.getOHLCV(symbol, interval, limit);
      break;
    }

    case 'getTopGainers': {
      const limit = this.getNodeParameter('limit', index) as number;
      result = await client.getTopGainers(limit);
      break;
    }

    case 'getTopLosers': {
      const limit = this.getNodeParameter('limit', index) as number;
      result = await client.getTopLosers(limit);
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result as IDataObject }];
}
