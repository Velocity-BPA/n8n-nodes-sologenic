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
        resource: ['staking'],
      },
    },
    options: [
      {
        name: 'Get Staking Info',
        value: 'getStakingInfo',
        description: 'Get overall staking information',
        action: 'Get staking info',
      },
      {
        name: 'Get Staking Pools',
        value: 'getStakingPools',
        description: 'Get available staking pools',
        action: 'Get staking pools',
      },
      {
        name: 'Get Staked Balance',
        value: 'getStakedBalance',
        description: 'Get staked balance for an address',
        action: 'Get staked balance',
      },
      {
        name: 'Get Rewards',
        value: 'getRewards',
        description: 'Get staking rewards for an address',
        action: 'Get rewards',
      },
    ],
    default: 'getStakingInfo',
  },
];

export const fields: INodeProperties[] = [
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['staking'],
        operation: ['getStakedBalance', 'getRewards'],
      },
    },
    default: '',
    description: 'XRPL wallet address',
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
    case 'getStakingInfo': {
      result = await client.getStakingInfo();
      break;
    }

    case 'getStakingPools': {
      const stakingInfo = await client.getStakingInfo();
      result = stakingInfo.pools;
      break;
    }

    case 'getStakedBalance': {
      const address = this.getNodeParameter('address', index) as string;
      const portfolio = await client.getPortfolio(address);
      const stakedHoldings = portfolio.holdings.filter(
        (h) => h.asset.toLowerCase().includes('staked') || h.asset.toLowerCase().includes('stake'),
      );
      result = {
        address,
        stakedAssets: stakedHoldings,
        totalStakedValue: stakedHoldings.reduce((sum, h) => sum + h.value, 0),
      };
      break;
    }

    case 'getRewards': {
      const address = this.getNodeParameter('address', index) as string;
      // Get staking info and calculate rewards based on portfolio
      const stakingInfo = await client.getStakingInfo();
      const portfolio = await client.getPortfolio(address);

      // Calculate estimated rewards based on APY
      const stakedValue = portfolio.holdings
        .filter((h) => h.asset.toLowerCase().includes('solo'))
        .reduce((sum, h) => sum + h.value, 0);

      const avgApy =
        stakingInfo.pools.reduce((sum, p) => sum + p.apy, 0) / stakingInfo.pools.length;

      result = {
        address,
        stakedValue,
        estimatedApy: avgApy,
        estimatedDailyReward: (stakedValue * avgApy) / 100 / 365,
        estimatedMonthlyReward: (stakedValue * avgApy) / 100 / 12,
        estimatedYearlyReward: (stakedValue * avgApy) / 100,
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result as IDataObject }];
}
