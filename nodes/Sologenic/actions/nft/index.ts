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
        resource: ['nft'],
      },
    },
    options: [
      {
        name: 'Get Collections',
        value: 'getCollections',
        description: 'Get list of NFT collections',
        action: 'Get collections',
      },
      {
        name: 'Get Collection',
        value: 'getCollection',
        description: 'Get details of a specific NFT collection',
        action: 'Get collection',
      },
      {
        name: 'Get Collection NFTs',
        value: 'getCollectionNfts',
        description: 'Get NFTs in a collection',
        action: 'Get collection NFTs',
      },
      {
        name: 'Get NFT',
        value: 'getNft',
        description: 'Get details of a specific NFT',
        action: 'Get NFT',
      },
    ],
    default: 'getCollections',
  },
];

export const fields: INodeProperties[] = [
  {
    displayName: 'Collection ID',
    name: 'collectionId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['nft'],
        operation: ['getCollection', 'getCollectionNfts'],
      },
    },
    default: '',
    description: 'ID of the NFT collection',
  },
  {
    displayName: 'Token ID',
    name: 'tokenId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['nft'],
        operation: ['getNft'],
      },
    },
    default: '',
    description: 'ID of the NFT token',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['nft'],
        operation: ['getCollections', 'getCollectionNfts'],
      },
    },
    default: 20,
    description: 'Maximum number of results to return',
  },
  {
    displayName: 'Offset',
    name: 'offset',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['nft'],
        operation: ['getCollectionNfts'],
      },
    },
    default: 0,
    description: 'Number of results to skip for pagination',
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
    case 'getCollections': {
      const limit = this.getNodeParameter('limit', index) as number;
      result = await client.getNftCollections(limit);
      break;
    }

    case 'getCollection': {
      const collectionId = this.getNodeParameter('collectionId', index) as string;
      result = await client.getNftCollection(collectionId);
      break;
    }

    case 'getCollectionNfts': {
      const collectionId = this.getNodeParameter('collectionId', index) as string;
      const limit = this.getNodeParameter('limit', index) as number;
      const offset = this.getNodeParameter('offset', index) as number;
      result = await client.getCollectionNfts(collectionId, limit, offset);
      break;
    }

    case 'getNft': {
      const tokenId = this.getNodeParameter('tokenId', index) as string;
      result = await client.getNft(tokenId);
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result as IDataObject }];
}
