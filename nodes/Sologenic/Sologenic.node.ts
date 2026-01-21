/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

import * as account from './actions/account';
import * as solo from './actions/solo';
import * as dex from './actions/dex';
import * as market from './actions/market';
import * as orderBook from './actions/orderBook';
import * as tokenizedAssets from './actions/tokenizedAssets';
import * as nft from './actions/nft';
import * as staking from './actions/staking';

// Licensing notice - logged once per node load
let licensingNoticeShown = false;

function showLicensingNotice(): void {
  if (licensingNoticeShown) return;
  licensingNoticeShown = true;

  console.warn(`
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
}

export class Sologenic implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sologenic',
    name: 'sologenic',
    icon: 'file:sologenic.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description:
      'Interact with Sologenic ecosystem on XRPL - DEX trading, tokenized assets, NFTs, and staking',
    defaults: {
      name: 'Sologenic',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'sologenicNetwork',
        required: true,
        displayOptions: {
          show: {
            resource: ['account', 'orderBook'],
          },
        },
      },
      {
        name: 'sologenicApi',
        required: true,
        displayOptions: {
          show: {
            resource: ['solo', 'market', 'orderBook', 'tokenizedAssets', 'nft', 'staking'],
          },
        },
      },
      {
        name: 'sologenicDex',
        required: true,
        displayOptions: {
          show: {
            resource: ['dex'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Account',
            value: 'account',
            description: 'XRPL account operations',
          },
          {
            name: 'DEX',
            value: 'dex',
            description: 'DEX trading operations',
          },
          {
            name: 'Market',
            value: 'market',
            description: 'Market data and price information',
          },
          {
            name: 'NFT',
            value: 'nft',
            description: 'NFT marketplace operations',
          },
          {
            name: 'Order Book',
            value: 'orderBook',
            description: 'Order book data',
          },
          {
            name: 'SOLO Token',
            value: 'solo',
            description: 'SOLO token operations',
          },
          {
            name: 'Staking',
            value: 'staking',
            description: 'Staking operations',
          },
          {
            name: 'Tokenized Assets',
            value: 'tokenizedAssets',
            description: 'Tokenized stocks, ETFs, and commodities',
          },
        ],
        default: 'account',
      },
      // Account operations and fields
      ...account.operations,
      ...account.fields,
      // SOLO operations and fields
      ...solo.operations,
      ...solo.fields,
      // DEX operations and fields
      ...dex.operations,
      ...dex.fields,
      // Market operations and fields
      ...market.operations,
      ...market.fields,
      // Order Book operations and fields
      ...orderBook.operations,
      ...orderBook.fields,
      // Tokenized Assets operations and fields
      ...tokenizedAssets.operations,
      ...tokenizedAssets.fields,
      // NFT operations and fields
      ...nft.operations,
      ...nft.fields,
      // Staking operations and fields
      ...staking.operations,
      ...staking.fields,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Show licensing notice once per node load
    showLicensingNotice();

    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let result: INodeExecutionData[];

        switch (resource) {
          case 'account':
            result = await account.execute.call(this, i);
            break;
          case 'solo':
            result = await solo.execute.call(this, i);
            break;
          case 'dex':
            result = await dex.execute.call(this, i);
            break;
          case 'market':
            result = await market.execute.call(this, i);
            break;
          case 'orderBook':
            result = await orderBook.execute.call(this, i);
            break;
          case 'tokenizedAssets':
            result = await tokenizedAssets.execute.call(this, i);
            break;
          case 'nft':
            result = await nft.execute.call(this, i);
            break;
          case 'staking':
            result = await staking.execute.call(this, i);
            break;
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }

        returnData.push(...result);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : String(error),
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
