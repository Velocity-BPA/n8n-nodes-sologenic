/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IPollFunctions,
} from 'n8n-workflow';

import { XrplClient } from './transport/xrplClient';
import { MarketDataClient } from './transport/marketDataClient';

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

async function pollBalanceChanged(
  context: IPollFunctions,
  webhookData: IDataObject,
): Promise<INodeExecutionData[] | null> {
  const credentials = await context.getCredentials('sologenicNetwork');
  const address = context.getNodeParameter('address') as string;
  const currency = context.getNodeParameter('currency') as string;

  const client = XrplClient.fromCredentials({
    network: credentials.network as string,
    customWsUrl: credentials.customWsUrl as string | undefined,
  });

  try {
    await client.connect();

    let currentBalance: string;

    if (currency === 'XRP') {
      currentBalance = await client.getXrpBalance(address);
    } else {
      const balances = await client.getBalances(address);
      const tokenBalance = balances.find((b: { currency: string }) => b.currency === currency);
      currentBalance = tokenBalance?.value || '0';
    }

    const previousBalance = webhookData.lastBalance as string | undefined;
    webhookData.lastBalance = currentBalance;

    if (previousBalance !== undefined && previousBalance !== currentBalance) {
      return [
        {
          json: {
            address,
            currency,
            previousBalance,
            currentBalance,
            change: parseFloat(currentBalance) - parseFloat(previousBalance),
            timestamp: new Date().toISOString(),
          },
        },
      ];
    }

    return null;
  } finally {
    await client.disconnect();
  }
}

async function pollPriceAlert(
  context: IPollFunctions,
  webhookData: IDataObject,
): Promise<INodeExecutionData[] | null> {
  const credentials = await context.getCredentials('sologenicApi');
  const symbol = context.getNodeParameter('symbol') as string;
  const alertType = context.getNodeParameter('alertType') as string;
  const threshold = context.getNodeParameter('threshold') as number;

  const client = new MarketDataClient({
    apiEndpoint: credentials.apiEndpoint as 'production' | 'sandbox' | 'custom',
    customApiUrl: credentials.customApiUrl as string | undefined,
    apiKey: credentials.apiKey as string | undefined,
  });

  const ticker = await client.getTicker(symbol);
  const currentPrice = ticker.price;
  const previousPrice = webhookData.lastPrice as number | undefined;

  webhookData.lastPrice = currentPrice;

  let shouldTrigger = false;
  let alertMessage = '';

  switch (alertType) {
    case 'above':
      if (currentPrice > threshold && (previousPrice === undefined || previousPrice <= threshold)) {
        shouldTrigger = true;
        alertMessage = `Price crossed above ${threshold}`;
      }
      break;

    case 'below':
      if (currentPrice < threshold && (previousPrice === undefined || previousPrice >= threshold)) {
        shouldTrigger = true;
        alertMessage = `Price crossed below ${threshold}`;
      }
      break;

    case 'change':
      if (previousPrice !== undefined) {
        const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
        if (Math.abs(changePercent) >= threshold) {
          shouldTrigger = true;
          alertMessage = `Price changed by ${changePercent.toFixed(2)}%`;
        }
      }
      break;
  }

  if (shouldTrigger) {
    return [
      {
        json: {
          symbol,
          alertType,
          threshold,
          currentPrice,
          previousPrice,
          alertMessage,
          ticker,
          timestamp: new Date().toISOString(),
        },
      },
    ];
  }

  return null;
}

async function pollTransactionReceived(
  context: IPollFunctions,
  webhookData: IDataObject,
): Promise<INodeExecutionData[] | null> {
  const credentials = await context.getCredentials('sologenicNetwork');
  const address = context.getNodeParameter('address') as string;

  const client = XrplClient.fromCredentials({
    network: credentials.network as string,
    customWsUrl: credentials.customWsUrl as string | undefined,
  });

  try {
    await client.connect();

    const transactions = await client.getTransactions(address, 10);

    if (transactions.length === 0) {
      return null;
    }

    const lastSeenHash = webhookData.lastTransactionHash as string | undefined;
    const newTransactions: INodeExecutionData[] = [];

    for (const tx of transactions) {
      const txHash = (tx as IDataObject).hash as string;

      if (txHash === lastSeenHash) {
        break;
      }

      newTransactions.push({
        json: {
          address,
          transaction: tx as IDataObject,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (newTransactions.length > 0) {
      webhookData.lastTransactionHash = (transactions[0] as IDataObject).hash;
      return newTransactions;
    }

    return null;
  } finally {
    await client.disconnect();
  }
}

export class SologenicTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sologenic Trigger',
    name: 'sologenicTrigger',
    icon: 'file:sologenic.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["triggerType"]}}',
    description: 'Triggers when Sologenic events occur',
    defaults: {
      name: 'Sologenic Trigger',
    },
    polling: true,
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'sologenicNetwork',
        required: true,
        displayOptions: {
          show: {
            triggerType: ['balanceChanged', 'transactionReceived'],
          },
        },
      },
      {
        name: 'sologenicApi',
        required: true,
        displayOptions: {
          show: {
            triggerType: ['priceAlert'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Trigger Type',
        name: 'triggerType',
        type: 'options',
        options: [
          {
            name: 'Balance Changed',
            value: 'balanceChanged',
            description: 'Trigger when account balance changes',
          },
          {
            name: 'Price Alert',
            value: 'priceAlert',
            description: 'Trigger when price crosses threshold',
          },
          {
            name: 'Transaction Received',
            value: 'transactionReceived',
            description: 'Trigger when account receives a transaction',
          },
        ],
        default: 'balanceChanged',
        description: 'Type of event to trigger on',
      },
      {
        displayName: 'Address',
        name: 'address',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            triggerType: ['balanceChanged', 'transactionReceived'],
          },
        },
        default: '',
        description: 'XRPL wallet address to monitor',
      },
      {
        displayName: 'Symbol',
        name: 'symbol',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            triggerType: ['priceAlert'],
          },
        },
        default: 'SOLO/XRP',
        description: 'Trading pair symbol to monitor',
      },
      {
        displayName: 'Alert Type',
        name: 'alertType',
        type: 'options',
        displayOptions: {
          show: {
            triggerType: ['priceAlert'],
          },
        },
        options: [
          { name: 'Price Above', value: 'above' },
          { name: 'Price Below', value: 'below' },
          { name: 'Price Change %', value: 'change' },
        ],
        default: 'above',
        description: 'Type of price alert',
      },
      {
        displayName: 'Threshold',
        name: 'threshold',
        type: 'number',
        required: true,
        displayOptions: {
          show: {
            triggerType: ['priceAlert'],
          },
        },
        default: 0,
        description: 'Price threshold value',
      },
      {
        displayName: 'Currency',
        name: 'currency',
        type: 'string',
        displayOptions: {
          show: {
            triggerType: ['balanceChanged'],
          },
        },
        default: 'XRP',
        description: 'Currency to monitor (XRP, SOLO, or token currency code)',
      },
    ],
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    // Show licensing notice once per node load
    showLicensingNotice();

    const triggerType = this.getNodeParameter('triggerType') as string;
    const webhookData = this.getWorkflowStaticData('node');

    let result: INodeExecutionData[] | null = null;

    switch (triggerType) {
      case 'balanceChanged':
        result = await pollBalanceChanged(this, webhookData);
        break;

      case 'priceAlert':
        result = await pollPriceAlert(this, webhookData);
        break;

      case 'transactionReceived':
        result = await pollTransactionReceived(this, webhookData);
        break;

      default:
        throw new Error(`Unknown trigger type: ${triggerType}`);
    }

    if (result && result.length > 0) {
      return [result];
    }

    return null;
  }
}
