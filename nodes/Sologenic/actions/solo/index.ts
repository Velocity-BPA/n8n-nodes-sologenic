/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { withXrplClient } from '../../transport/xrplClient';
import { withSologenicApi } from '../../transport/sologenicApi';
import { SOLO_TOKEN } from '../../constants/tokens';

export const soloOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['solo'] } },
    options: [
      { name: 'Get Balance', value: 'getBalance', description: 'Get SOLO token balance', action: 'Get SOLO balance' },
      { name: 'Get Price', value: 'getPrice', description: 'Get current SOLO price', action: 'Get SOLO price' },
      { name: 'Get Market Data', value: 'getMarketData', description: 'Get SOLO market data', action: 'Get market data' },
      { name: 'Get Staking Info', value: 'getStakingInfo', description: 'Get SOLO staking information', action: 'Get staking info' },
      { name: 'Transfer', value: 'transfer', description: 'Transfer SOLO tokens', action: 'Transfer SOLO' },
    ],
    default: 'getBalance',
  },
];

export const soloFields: INodeProperties[] = [
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['solo'], operation: ['getBalance', 'getStakingInfo', 'transfer'] } },
    default: '',
    placeholder: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    description: 'XRPL account address',
  },
  {
    displayName: 'Destination',
    name: 'destination',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['solo'], operation: ['transfer'] } },
    default: '',
    placeholder: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    description: 'Destination XRPL address',
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['solo'], operation: ['transfer'] } },
    default: '',
    description: 'Amount of SOLO to transfer',
  },
  {
    displayName: 'Destination Tag',
    name: 'destinationTag',
    type: 'number',
    displayOptions: { show: { resource: ['solo'], operation: ['transfer'] } },
    default: 0,
    description: 'Optional destination tag',
  },
];

export async function executeSoloOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;

  if (operation === 'getPrice' || operation === 'getMarketData') {
    const credentials = await this.getCredentials('sologenicApi');
    const result = await withSologenicApi(
      {
        apiEndpoint: credentials.apiEndpoint as string,
        customApiUrl: credentials.customApiUrl as string | undefined,
        apiKey: credentials.apiKey as string,
        apiSecret: credentials.apiSecret as string,
      },
      async (client) => {
        if (operation === 'getPrice') {
          return client.getSoloPrice();
        }
        return client.getSoloMarketData();
      },
    );
    return [{ json: result }];
  }

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
          const trustlines = await client.getAccountTrustlines(address, 200);
          const soloLine = trustlines.lines.find(
            (line) => line.currency === SOLO_TOKEN.currency && line.account === SOLO_TOKEN.issuer,
          );

          return {
            address,
            currency: SOLO_TOKEN.currency,
            issuer: SOLO_TOKEN.issuer,
            balance: soloLine?.balance || '0',
            limit: soloLine?.limit || '0',
            hasTrustline: !!soloLine,
          };
        }

        case 'getStakingInfo': {
          // For now, return basic staking info from trustlines
          // Full staking integration would require additional API calls
          const trustlines = await client.getAccountTrustlines(address, 200);
          const soloLine = trustlines.lines.find(
            (line) => line.currency === SOLO_TOKEN.currency && line.account === SOLO_TOKEN.issuer,
          );

          return {
            address,
            soloBalance: soloLine?.balance || '0',
            stakingEnabled: false,
            stakedAmount: '0',
            pendingRewards: '0',
            message: 'Staking info requires Sologenic staking API integration',
          };
        }

        case 'transfer': {
          const destination = this.getNodeParameter('destination', index) as string;
          const amount = this.getNodeParameter('amount', index) as string;
          const destinationTag = this.getNodeParameter('destinationTag', index, 0) as number;

          // Build payment transaction
          const paymentTx = {
            TransactionType: 'Payment',
            Account: address,
            Destination: destination,
            Amount: {
              currency: SOLO_TOKEN.currency,
              issuer: SOLO_TOKEN.issuer,
              value: amount,
            },
            ...(destinationTag > 0 && { DestinationTag: destinationTag }),
          };

          return {
            transaction: paymentTx,
            status: 'prepared',
            message: 'Transaction prepared. Sign and submit using wallet credentials.',
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
export const operations = soloOperations;
export const fields = soloFields;
export const execute = executeSoloOperation;
