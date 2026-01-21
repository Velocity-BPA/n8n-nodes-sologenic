/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class SologenicDex implements ICredentialType {
  name = 'sologenicDex';
  displayName = 'Sologenic DEX';
  documentationUrl = 'https://docs.sologenic.org/dex';
  properties: INodeProperties[] = [
    {
      displayName: 'DEX Environment',
      name: 'dexEnvironment',
      type: 'options',
      options: [
        { name: 'Production', value: 'production' },
        { name: 'Testnet', value: 'testnet' },
        { name: 'Custom', value: 'custom' },
      ],
      default: 'production',
      description: 'Sologenic DEX environment',
    },
    {
      displayName: 'Custom DEX URL',
      name: 'customDexUrl',
      type: 'string',
      default: '',
      placeholder: 'https://custom-dex.example.com',
      description: 'Custom DEX endpoint URL',
      displayOptions: {
        show: {
          dexEnvironment: ['custom'],
        },
      },
    },
    {
      displayName: 'Trading API Key',
      name: 'tradingApiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Your DEX trading API key',
    },
    {
      displayName: 'Trading Wallet Address',
      name: 'tradingWalletAddress',
      type: 'string',
      default: '',
      placeholder: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      description: 'XRPL address for trading',
    },
    {
      displayName: 'Wallet Seed',
      name: 'walletSeed',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Wallet seed for signing transactions',
    },
    {
      displayName: 'Max Slippage (%)',
      name: 'maxSlippage',
      type: 'number',
      default: 1,
      description: 'Maximum acceptable slippage percentage',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-Trading-Key': '={{$credentials.tradingApiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.dexEnvironment === "production" ? "https://dex-api.sologenic.org" : $credentials.dexEnvironment === "testnet" ? "https://testnet-dex.sologenic.org" : $credentials.customDexUrl}}',
      url: '/api/v1/health',
      method: 'GET',
    },
  };
}
