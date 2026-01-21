/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { withDexClient } from '../../transport/dexClient';

export const dexOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['dex'] } },
    options: [
      { name: 'Place Order', value: 'placeOrder', description: 'Place a new order', action: 'Place order' },
      { name: 'Cancel Order', value: 'cancelOrder', description: 'Cancel an existing order', action: 'Cancel order' },
      { name: 'Cancel All Orders', value: 'cancelAllOrders', description: 'Cancel all open orders', action: 'Cancel all orders' },
      { name: 'Get Order', value: 'getOrder', description: 'Get order details', action: 'Get order' },
      { name: 'Get Open Orders', value: 'getOpenOrders', description: 'Get all open orders', action: 'Get open orders' },
      { name: 'Get Order History', value: 'getOrderHistory', description: 'Get order history', action: 'Get order history' },
      { name: 'Get Trade History', value: 'getTradeHistory', description: 'Get trade history', action: 'Get trade history' },
      { name: 'Get Trading Pairs', value: 'getTradingPairs', description: 'Get available trading pairs', action: 'Get trading pairs' },
    ],
    default: 'getOpenOrders',
  },
];

export const dexFields: INodeProperties[] = [
  {
    displayName: 'Symbol',
    name: 'symbol',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['dex'], operation: ['placeOrder', 'getOpenOrders', 'getOrderHistory', 'getTradeHistory', 'cancelAllOrders'] } },
    default: 'SOLO/XRP',
    description: 'Trading pair symbol',
  },
  {
    displayName: 'Order ID',
    name: 'orderId',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['dex'], operation: ['cancelOrder', 'getOrder'] } },
    default: '',
    description: 'Order ID',
  },
  {
    displayName: 'Side',
    name: 'side',
    type: 'options',
    options: [
      { name: 'Buy', value: 'buy' },
      { name: 'Sell', value: 'sell' },
    ],
    required: true,
    displayOptions: { show: { resource: ['dex'], operation: ['placeOrder'] } },
    default: 'buy',
    description: 'Order side',
  },
  {
    displayName: 'Order Type',
    name: 'orderType',
    type: 'options',
    options: [
      { name: 'Limit', value: 'limit' },
      { name: 'Market', value: 'market' },
    ],
    required: true,
    displayOptions: { show: { resource: ['dex'], operation: ['placeOrder'] } },
    default: 'limit',
    description: 'Order type',
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['dex'], operation: ['placeOrder'] } },
    default: '',
    description: 'Order amount',
  },
  {
    displayName: 'Price',
    name: 'price',
    type: 'string',
    displayOptions: { show: { resource: ['dex'], operation: ['placeOrder'], orderType: ['limit'] } },
    default: '',
    description: 'Limit price (required for limit orders)',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['dex'], operation: ['getOrderHistory', 'getTradeHistory'] } },
    default: 50,
    description: 'Maximum results to return',
  },
];

export async function executeDexOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const credentials = await this.getCredentials('sologenicDex');

  const result = await withDexClient(
    {
      dexEnvironment: credentials.dexEnvironment as string,
      customDexUrl: credentials.customDexUrl as string | undefined,
      tradingApiKey: credentials.tradingApiKey as string,
      tradingWalletAddress: credentials.tradingWalletAddress as string,
      walletSeed: credentials.walletSeed as string,
      maxSlippage: credentials.maxSlippage as number,
    },
    async (client) => {
      switch (operation) {
        case 'placeOrder': {
          const symbol = this.getNodeParameter('symbol', index) as string;
          const side = this.getNodeParameter('side', index) as 'buy' | 'sell';
          const orderType = this.getNodeParameter('orderType', index) as 'limit' | 'market';
          const amount = this.getNodeParameter('amount', index) as string;
          const price = orderType === 'limit' ? (this.getNodeParameter('price', index) as string) : undefined;

          return client.placeOrder({
            symbol,
            side,
            type: orderType,
            amount,
            price,
          });
        }

        case 'cancelOrder': {
          const orderId = this.getNodeParameter('orderId', index) as string;
          return client.cancelOrder(orderId);
        }

        case 'cancelAllOrders': {
          const symbol = this.getNodeParameter('symbol', index, '') as string;
          return client.cancelAllOrders(symbol || undefined);
        }

        case 'getOrder': {
          const orderId = this.getNodeParameter('orderId', index) as string;
          return client.getOrder(orderId);
        }

        case 'getOpenOrders': {
          const symbol = this.getNodeParameter('symbol', index, '') as string;
          return { orders: await client.getOpenOrders(symbol || undefined) };
        }

        case 'getOrderHistory': {
          const symbol = this.getNodeParameter('symbol', index, '') as string;
          const limit = this.getNodeParameter('limit', index, 50) as number;
          return { orders: await client.getOrderHistory(symbol || undefined, limit) };
        }

        case 'getTradeHistory': {
          const symbol = this.getNodeParameter('symbol', index, '') as string;
          const limit = this.getNodeParameter('limit', index, 50) as number;
          return { trades: await client.getTradeHistory(symbol || undefined, limit) };
        }

        case 'getTradingPairs': {
          return { pairs: await client.getTradingPairs() };
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }
    },
  );

  return [{ json: result as IDataObject }];
}

// Alias exports for compatibility with main node
export const operations = dexOperations;
export const fields = dexFields;
export const execute = executeDexOperation;
