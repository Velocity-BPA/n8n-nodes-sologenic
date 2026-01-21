/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { SologenicApiClient } from '../../transport/sologenicApi';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['tokenizedAssets'],
      },
    },
    options: [
      {
        name: 'Get Assets',
        value: 'getAssets',
        description: 'Get list of tokenized assets',
        action: 'Get assets',
      },
      {
        name: 'Get Asset',
        value: 'getAsset',
        description: 'Get details of a specific tokenized asset',
        action: 'Get asset',
      },
      {
        name: 'Search Assets',
        value: 'searchAssets',
        description: 'Search for tokenized assets',
        action: 'Search assets',
      },
    ],
    default: 'getAssets',
  },
];

export const fields: INodeProperties[] = [
  {
    displayName: 'Category',
    name: 'category',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['tokenizedAssets'],
        operation: ['getAssets'],
      },
    },
    options: [
      { name: 'All', value: 'all' },
      { name: 'Stocks', value: 'stocks' },
      { name: 'ETFs', value: 'etf' },
      { name: 'Commodities', value: 'commodities' },
      { name: 'Crypto', value: 'crypto' },
    ],
    default: 'all',
    description: 'Filter by asset category',
  },
  {
    displayName: 'Symbol',
    name: 'symbol',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenizedAssets'],
        operation: ['getAsset'],
      },
    },
    default: '',
    description: 'Asset symbol (e.g., AAPL, TSLA)',
  },
  {
    displayName: 'Search Query',
    name: 'searchQuery',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenizedAssets'],
        operation: ['searchAssets'],
      },
    },
    default: '',
    description: 'Search query for asset name or symbol',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['tokenizedAssets'],
        operation: ['getAssets', 'searchAssets'],
      },
    },
    default: 50,
    description: 'Maximum number of results to return',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const credentials = await this.getCredentials('sologenicApi');

  const client = SologenicApiClient.fromCredentials({
    apiEndpoint: credentials.apiEndpoint as string,
    customApiUrl: credentials.customApiUrl as string | undefined,
    apiKey: credentials.apiKey as string,
    apiSecret: credentials.apiSecret as string,
  });

  let result: unknown;

  switch (operation) {
    case 'getAssets': {
      const category = this.getNodeParameter('category', index) as string;
      const limit = this.getNodeParameter('limit', index) as number;
      const assets = await client.getAssets(category === 'all' ? undefined : category);
      result = assets.slice(0, limit);
      break;
    }

    case 'getAsset': {
      const symbol = this.getNodeParameter('symbol', index) as string;
      result = await client.getAssetDetails(symbol);
      break;
    }

    case 'searchAssets': {
      const searchQuery = this.getNodeParameter('searchQuery', index) as string;
      const limit = this.getNodeParameter('limit', index) as number;
      result = await client.searchAssets(searchQuery, limit);
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result as IDataObject }];
}
