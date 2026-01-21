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

export class SologenicNetwork implements ICredentialType {
  name = 'sologenicNetwork';
  displayName = 'Sologenic Network';
  documentationUrl = 'https://docs.sologenic.org';
  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        { name: 'XRPL Mainnet', value: 'mainnet' },
        { name: 'XRPL Testnet', value: 'testnet' },
        { name: 'XRPL Devnet', value: 'devnet' },
        { name: 'Custom', value: 'custom' },
      ],
      default: 'mainnet',
      description: 'The XRPL network to connect to',
    },
    {
      displayName: 'Custom WebSocket URL',
      name: 'customWsUrl',
      type: 'string',
      default: '',
      placeholder: 'wss://custom-xrpl-node.example.com',
      description: 'Custom WebSocket URL for XRPL connection',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Wallet Seed',
      name: 'walletSeed',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Your XRPL wallet seed (starts with "s")',
    },
    {
      displayName: 'Wallet Mnemonic',
      name: 'walletMnemonic',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Optional 24-word recovery phrase',
    },
    {
      displayName: 'Regular Key',
      name: 'regularKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Optional regular key for signing transactions',
    },
    {
      displayName: 'Sologenic API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Optional Sologenic API key for enhanced features',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.sologenic.org',
      url: '/api/v1/health',
      method: 'GET',
    },
  };
}
