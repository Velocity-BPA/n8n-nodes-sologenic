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

export class SologenicApi implements ICredentialType {
  name = 'sologenicApi';
  displayName = 'Sologenic API';
  documentationUrl = 'https://docs.sologenic.org/api';
  properties: INodeProperties[] = [
    {
      displayName: 'API Environment',
      name: 'apiEndpoint',
      type: 'options',
      options: [
        { name: 'Production', value: 'production' },
        { name: 'Sandbox', value: 'sandbox' },
        { name: 'Custom', value: 'custom' },
      ],
      default: 'production',
      description: 'Sologenic API environment',
    },
    {
      displayName: 'Custom API URL',
      name: 'customApiUrl',
      type: 'string',
      default: '',
      placeholder: 'https://custom-api.example.com',
      description: 'Custom API endpoint URL',
      displayOptions: {
        show: {
          apiEndpoint: ['custom'],
        },
      },
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Your Sologenic API key',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Your Sologenic API secret',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
        'X-API-Secret': '={{$credentials.apiSecret}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.apiEndpoint === "production" ? "https://api.sologenic.org" : $credentials.apiEndpoint === "sandbox" ? "https://sandbox-api.sologenic.org" : $credentials.customApiUrl}}',
      url: '/api/v1/health',
      method: 'GET',
    },
  };
}
