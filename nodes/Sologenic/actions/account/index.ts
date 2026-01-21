/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { withXrplClient } from '../../transport/xrplClient';
import { formatTrustline } from '../../utils/trustlineUtils';
import { calculateAvailableBalance } from '../../utils/feeUtils';

export const accountOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['account'] } },
    options: [
      { name: 'Get Balance', value: 'getBalance', description: 'Get XRP balance for an account', action: 'Get balance' },
      { name: 'Get Account Info', value: 'getInfo', description: 'Get detailed account information', action: 'Get account info' },
      { name: 'Get Trustlines', value: 'getTrustlines', description: 'Get account trustlines', action: 'Get trustlines' },
      { name: 'Get Transactions', value: 'getTransactions', description: 'Get account transactions', action: 'Get transactions' },
    ],
    default: 'getBalance',
  },
];

export const accountFields: INodeProperties[] = [
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['account'] } },
    default: '',
    placeholder: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    description: 'The XRPL account address',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['account'], operation: ['getTrustlines', 'getTransactions'] } },
    default: 20,
    description: 'Maximum number of results to return',
  },
];

export async function executeAccountOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const address = this.getNodeParameter('address', index) as string;
  const credentials = await this.getCredentials('sologenicNetwork');

  const result = await withXrplClient(
    {
      network: credentials.network as string,
      customWsUrl: credentials.customWsUrl as string | undefined,
    },
    async (client) => {
      switch (operation) {
        case 'getBalance': {
          const balance = await client.getAccountBalance(address);
          const info = await client.getAccountInfo(address);
          const ownerCount = info.account_data.OwnerCount || 0;
          const availableBalance = calculateAvailableBalance(balance.xrp, ownerCount);
          return {
            address,
            xrpBalance: balance.xrp,
            dropsBalance: balance.drops,
            availableBalance,
            ownerCount,
          };
        }

        case 'getInfo': {
          const info = await client.getAccountInfo(address);
          return {
            address,
            ...info.account_data,
            ledgerIndex: info.ledger_index,
          };
        }

        case 'getTrustlines': {
          const limit = this.getNodeParameter('limit', index, 200) as number;
          const trustlines = await client.getAccountTrustlines(address, limit);
          const formatted = trustlines.lines.map((line) =>
            formatTrustline({
              currency: line.currency,
              issuer: line.account,
              balance: line.balance,
              limit: line.limit,
              limitPeer: line.limit_peer,
              qualityIn: line.quality_in || 0,
              qualityOut: line.quality_out || 0,
              noRipple: line.no_ripple || false,
              noRipplePeer: line.no_ripple_peer || false,
              freeze: line.freeze || false,
              freezePeer: line.freeze_peer || false,
            }),
          );
          return {
            address,
            count: formatted.length,
            trustlines: formatted,
          };
        }

        case 'getTransactions': {
          const limit = this.getNodeParameter('limit', index, 20) as number;
          const transactions = await client.getAccountTransactions(address, limit);
          return {
            address,
            count: transactions.transactions.length,
            transactions: transactions.transactions.map((tx) => ({
              hash: tx.tx ? (tx.tx as { hash?: string }).hash : undefined,
              type: tx.tx ? (tx.tx as { TransactionType?: string }).TransactionType : undefined,
              result: tx.meta ? (tx.meta as { TransactionResult?: string }).TransactionResult : undefined,
              validated: tx.validated,
            })),
            marker: transactions.marker,
          };
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }
    },
  );

  return [{ json: result as IDataObject }];
}

// Alias exports for compatibility with main node
export const operations = accountOperations;
export const fields = accountFields;
export const execute = executeAccountOperation;
