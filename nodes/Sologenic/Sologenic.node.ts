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
import { NodeOperationError } from 'n8n-workflow';

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
            resource: ['solo', 'market', 'orderBook', 'tokenizedAssets', 'nft', 'staking', 'token', 'order'],
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
            name: 'Order',
            value: 'order',
            description: 'Trading order operations',
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
            name: 'Token',
            value: 'token',
            description: 'Token operations',
          },
          {
            name: 'Tokenized Assets',
            value: 'tokenizedAssets',
            description: 'Tokenized stocks, ETFs, and commodities',
          },
        ],
        default: 'account',
      },
      // Existing resource operations and fields
      ...account.operations,
      ...account.fields,
      ...solo.operations,
      ...solo.fields,
      ...dex.operations,
      ...dex.fields,
      ...market.operations,
      ...market.fields,
      ...orderBook.operations,
      ...orderBook.fields,
      ...tokenizedAssets.operations,
      ...tokenizedAssets.fields,
      ...nft.operations,
      ...nft.fields,
      ...staking.operations,
      ...staking.fields,
      // New resource operations and fields from generated code
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['token'] } },
        options: [
          { name: 'Get Tokens', value: 'getTokens', description: 'Get list of supported tokens', action: 'Get tokens' },
          { name: 'Get Token', value: 'getToken', description: 'Get specific token details', action: 'Get token' },
          { name: 'Get Token Price', value: 'getTokenPrice', description: 'Get current token price', action: 'Get token price' },
          { name: 'Get Token Price History', value: 'getTokenPriceHistory', description: 'Get token price history', action: 'Get token price history' },
          { name: 'Get Solo Token Info', value: 'getSoloTokenInfo', description: 'Get SOLO token specific information', action: 'Get solo token info' },
          { name: 'Get Token Holders', value: 'getTokenHolders', description: 'Get token holder statistics', action: 'Get token holders' },
        ],
        default: 'getTokens',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['order'],
          },
        },
        options: [
          {
            name: 'Create Order',
            value: 'createOrder',
            description: 'Create new trading order',
            action: 'Create a new trading order',
          },
          {
            name: 'Get Orders',
            value: 'getOrders',
            description: "Get user's orders",
            action: "Get user's orders",
          },
          {
            name: 'Get Order',
            value: 'getOrder',
            description: 'Get specific order details',
            action: 'Get a specific order',
          },
          {
            name: 'Update Order',
            value: 'updateOrder',
            description: 'Modify existing order',
            action: 'Update an existing order',
          },
          {
            name: 'Cancel Order',
            value: 'cancelOrder',
            description: 'Cancel existing order',
            action: 'Cancel an existing order',
          },
          {
            name: 'Get Order History',
            value: 'getOrderHistory',
            description: 'Get order history',
            action: 'Get order history',
          },
        ],
        default: 'createOrder',
      },
      // Token resource fields
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        displayOptions: { show: { resource: ['token'], operation: ['getTokens'] } },
        default: '',
        description: 'Search term to filter tokens',
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: { show: { resource: ['token'], operation: ['getTokens', 'getTokenHolders'] } },
        default: 50,
        description: 'Maximum number of results to return',
      },
      {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        displayOptions: { show: { resource: ['token'], operation: ['getTokens'] } },
        default: 0,
        description: 'Number of results to skip',
      },
      {
        displayName: 'Token ID',
        name: 'tokenId',
        type: 'string',
        required: true,
        displayOptions: { show: { resource: ['token'], operation: ['getToken', 'getTokenPrice', 'getTokenPriceHistory', 'getTokenHolders'] } },
        default: '',
        description: 'The token identifier',
      },
      {
        displayName: 'VS Currency',
        name: 'vsCurrency',
        type: 'string',
        displayOptions: { show: { resource: ['token'], operation: ['getTokenPrice'] } },
        default: 'usd',
        description: 'The currency to compare against',
      },
      {
        displayName: 'Days',
        name: 'days',
        type: 'number',
        displayOptions: { show: { resource: ['token'], operation: ['getTokenPriceHistory'] } },
        default: 30,
        description: 'Number of days to retrieve history for',
      },
      {
        displayName: 'Interval',
        name: 'interval',
        type: 'options',
        displayOptions: { show: { resource: ['token'], operation: ['getTokenPriceHistory'] } },
        options: [
          { name: '1 Hour', value: '1h' },
          { name: '4 Hours', value: '4h' },
          { name: '1 Day', value: '1d' },
          { name: '1 Week', value: '1w' },
        ],
        default: '1d',
        description: 'Time interval for price history data',
      },
      // Order resource fields
      {
        displayName: 'Market',
        name: 'market',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['createOrder'],
          },
        },
        default: '',
        placeholder: 'BTC/XRP',
        description: 'Trading pair market',
      },
      {
        displayName: 'Side',
        name: 'side',
        type: 'options',
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['createOrder'],
          },
        },
        options: [
          {
            name: 'Buy',
            value: 'buy',
          },
          {
            name: 'Sell',
            value: 'sell',
          },
        ],
        default: 'buy',
        description: 'Order side (buy or sell)',
      },
      {
        displayName: 'Type',
        name: 'type',
        type: 'options',
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['createOrder'],
          },
        },
        options: [
          {
            name: 'Market',
            value: 'market',
          },
          {
            name: 'Limit',
            value: 'limit',
          },
          {
            name: 'Stop',
            value: 'stop',
          },
        ],
        default: 'limit',
        description: 'Order type',
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'number',
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['createOrder', 'updateOrder'],
          },
        },
        default: 0,
        description: 'Order amount',
      },
      {
        displayName: 'Price',
        name: 'price',
        type: 'number',
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['createOrder', 'updateOrder'],
          },
        },
        default: 0,
        description: 'Order price',
      },
      {
        displayName: 'Wallet Address',
        name: 'walletAddress',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['createOrder'],
          },
        },
        default: '',
        description: 'XRPL wallet address for DEX operations',
      },
      {
        displayName: 'Market',
        name: 'market',
        type: 'string',
        required: false,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['getOrders', 'getOrderHistory'],
          },
        },
        default: '',
        placeholder: 'BTC/XRP',
        description: 'Filter by trading pair market',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        required: false,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['getOrders'],
          },
        },
        options: [
          {
            name: 'Open',
            value: 'open',
          },
          {
            name: 'Filled',
            value: 'filled',
          },
          {
            name: 'Cancelled',
            value: 'cancelled',
          },
          {
            name: 'Partially Filled',
            value: 'partially_filled',
          },
        ],
        default: 'open',
        description: 'Filter by order status',
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        required: false,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['getOrders', 'getOrderHistory'],
          },
        },
        default: 100,
        description: 'Maximum number of records to return',
      },
      {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        required: false,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['getOrders'],
          },
        },
        default: 0,
        description: 'Number of records to skip',
      },
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['getOrder', 'updateOrder', 'cancelOrder'],
          },
        },
        default: '',
        description: 'The unique identifier of the order',
      },
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'dateTime',
        required: false,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['getOrderHistory'],
          },
        },
        default: '',
        description: 'Start date for order history filter',
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        required: false,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['getOrderHistory'],
          },
        },
        default: '',
        description: 'End date for order history filter',
      },
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
          case 'token':
            result = await executeTokenOperations.call(this, items);
            returnData.push(...result);
            return [returnData];
          case 'order':
            result = await executeOrderOperations.call(this, items);
            returnData.push(...result);
            return [returnData];
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }

        returnData.push(...result);
      } catch (error: any) {
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

// ============================================================
// New Resource Handler Functions
// ============================================================

async function executeTokenOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('sologenicApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;
      const baseOptions: any = {
        headers: {
          'X-API-Key': credentials.apiKey,
          'Content-Type': 'application/json',
        },
        json: true,
      };

      switch (operation) {
        case 'getTokens': {
          const search = this.getNodeParameter('search', i) as string;
          const limit = this.getNodeParameter('limit', i) as number;
          const offset = this.getNodeParameter('offset', i) as number;
          
          let url = `${credentials.baseUrl}/tokens`;
          const queryParams: string[] = [];
          
          if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
          if (limit) queryParams.push(`limit=${limit}`);
          if (offset) queryParams.push(`offset=${offset}`);
          
          if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
          }

          const options: any = {
            ...baseOptions,
            method: 'GET',
            url,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getToken': {
          const tokenId = this.getNodeParameter('tokenId', i) as string;
          
          const options: any = {
            ...baseOptions,
            method: 'GET',
            url: `${credentials.baseUrl}/tokens/${encodeURIComponent(tokenId)}`,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTokenPrice': {
          const tokenId = this.getNodeParameter('tokenId', i) as string;
          const vsCurrency = this.getNodeParameter('vsCurrency', i) as string;
          
          let url = `${credentials.baseUrl}/tokens/${encodeURIComponent(tokenId)}/price`;
          if (vsCurrency) {
            url += `?vs_currency=${encodeURIComponent(vsCurrency)}`;
          }

          const options: any = {
            ...baseOptions,
            method: 'GET',
            url,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTokenPriceHistory': {
          const tokenId = this.getNodeParameter('tokenId', i) as string;
          const days = this.getNodeParameter('days', i) as number;
          const interval = this.getNodeParameter('interval', i) as string;
          
          let url = `${credentials.baseUrl}/tokens/${encodeURIComponent(tokenId)}/history`;
          const queryParams: string[] = [];
          
          if (days) queryParams.push(`days=${days}`);
          if (interval) queryParams.push(`interval=${encodeURIComponent(interval)}`);
          
          if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
          }

          const options: any = {
            ...baseOptions,
            method: 'GET',
            url,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getSoloTokenInfo': {
          const options: any = {
            ...baseOptions,
            method: 'GET',
            url: `${credentials.baseUrl}/tokens/solo`,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTokenHolders': {
          const tokenId = this.getNodeParameter('tokenId', i) as string;
          const limit = this.getNodeParameter('limit', i) as number;
          
          let url = `${credentials.baseUrl}/tokens/${encodeURIComponent(tokenId)}/holders`;
          if (limit) {
            url += `?limit=${limit}`;
          }

          const options: any = {
            ...baseOptions,
            method: 'GET',
            url,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      returnData.push({
        json: result,
        pairedItem: { item: i },
      });

    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({
          json: { error: error.message },
          pairedItem: { item: i },
        });
      } else {
        throw error;
      }
    }
  }

  return returnData;
}

async function executeOrderOperations(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const operation = this.getNodeParameter('operation', 0) as string;
	const credentials = await this.getCredentials('sologenicApi') as any;

	for (let i = 0; i < items.length; i++) {
		try {
			let result: any;

			switch (operation) {
				case 'createOrder': {
					const market = this.getNodeParameter('market', i) as string;
					const side = this.getNodeParameter('side', i) as string;
					const type = this.getNodeParameter('type', i) as string;
					const amount = this.getNodeParameter('amount', i) as number;
					const price = this.getNodeParameter('price', i) as number;
					const walletAddress = this.getNodeParameter('walletAddress', i) as string;

					const body = {
						market,
						side,
						type,
						amount,
						price,
						wallet_address: walletAddress,
					};

					const options: any = {
						method: 'POST',
						url: `${credentials.baseUrl}/orders`,
						headers: {
							'Authorization': `Bearer ${credentials.apiKey}`,
							'Content-Type': 'application/json',
						},
						body,
						json: true,
					};

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				case 'getOrders': {
					const market = this.getNodeParameter('market', i) as string;
					const status = this.getNodeParameter('status', i) as string;
					const limit = this.getNodeParameter('limit', i) as number;
					const offset = this.getNodeParameter('offset', i) as number;

					const queryParams: any = {};
					if (market) queryParams.market = market;
					if (status) queryParams.status = status;
					if (limit) queryParams.limit = limit.toString();
					if (offset) queryParams.offset = offset.toString();

					const queryString = Object.keys(queryParams).length > 0 
						? '?' + new URLSearchParams(queryParams).toString() 
						: '';

					const options: any = {
						method: 'GET',
						url: `${credentials.baseUrl}/orders${queryString}`,
						headers: {
							'Authorization': `Bearer ${credentials.apiKey}`,
						},
						json: true,
					};

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				case 'getOrder': {
					const orderId = this.getNodeParameter('orderId', i) as string;

					const options: any = {
						method: 'GET',
						url: `${credentials.baseUrl}/orders/${orderId}`,
						headers: {
							'Authorization': `Bearer ${credentials.apiKey}`,
						},
						json: true,
					};

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				case 'updateOrder': {
					const orderId = this.getNodeParameter('orderId', i) as string;
					const amount = this.getNodeParameter('amount', i) as number;
					const price = this.getNodeParameter('price', i) as number;

					const body = {
						amount,
						price,
					};

					const options: any = {
						method: 'PUT',
						url: `${credentials.baseUrl}/orders/${orderId}`,
						headers: {
							'Authorization': `Bearer ${credentials.apiKey}`,
							'Content-Type': 'application/json',
						},
						body,
						json: true,
					};

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				case 'cancelOrder': {
					const orderId = this.getNodeParameter('orderId', i) as string;

					const options: any = {
						method: 'DELETE',
						url: `${credentials.baseUrl}/orders/${orderId}`,
						headers: {
							'Authorization': `Bearer ${credentials.apiKey}`,
						},
						json: true,
					};

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				case 'getOrderHistory': {
					const market = this.getNodeParameter('market', i) as string;
					const startDate = this.getNodeParameter('startDate', i) as string;
					const endDate = this.getNodeParameter('endDate', i) as string;
					const limit = this.getNodeParameter('limit', i) as number;

					const queryParams: any = {};
					if (market) queryParams.market = market;
					if (startDate) queryParams.start_date = startDate;
					if (endDate) queryParams.end_date = endDate;
					if (limit) queryParams.limit = limit.toString();

					const queryString = Object.keys(queryParams).length > 0 
						? '?' + new URLSearchParams(queryParams).toString() 
						: '';

					const options: any = {
						method: 'GET',
						url: `${credentials.baseUrl}/orders/history${queryString}`,
						headers: {
							'Authorization': `Bearer ${credentials.apiKey}`,
						},
						json: true,
					};

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				default:
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
			}

			returnData.push({
				json: result,
				pairedItem: { item: i },
			});
		} catch (error: any) {
			if (this.continueOnFail()) {
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: i },
				});
			} else {
				throw error;
			}
		}
	}

	return returnData;
}