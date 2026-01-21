/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export const XRPL_NETWORKS = {
  mainnet: {
    name: 'XRPL Mainnet',
    wsUrl: 'wss://xrplcluster.com',
    explorerUrl: 'https://livenet.xrpl.org',
  },
  testnet: {
    name: 'XRPL Testnet',
    wsUrl: 'wss://s.altnet.rippletest.net:51233',
    explorerUrl: 'https://testnet.xrpl.org',
  },
  devnet: {
    name: 'XRPL Devnet',
    wsUrl: 'wss://s.devnet.rippletest.net:51233',
    explorerUrl: 'https://devnet.xrpl.org',
  },
} as const;

export const SOLOGENIC_API_ENDPOINTS = {
  production: 'https://api.sologenic.org',
  sandbox: 'https://sandbox-api.sologenic.org',
} as const;

export const SOLOGENIC_DEX_ENDPOINTS = {
  production: 'https://dex-api.sologenic.org',
  testnet: 'https://testnet-dex.sologenic.org',
} as const;

export function getXrplWsUrl(network: string, customUrl?: string): string {
  if (network === 'custom' && customUrl) {
    return customUrl;
  }
  const networkConfig = XRPL_NETWORKS[network as keyof typeof XRPL_NETWORKS];
  return networkConfig?.wsUrl || XRPL_NETWORKS.mainnet.wsUrl;
}

export function getSologenicApiUrl(endpoint: string, customUrl?: string): string {
  if (endpoint === 'custom' && customUrl) {
    return customUrl;
  }
  return SOLOGENIC_API_ENDPOINTS[endpoint as keyof typeof SOLOGENIC_API_ENDPOINTS] || SOLOGENIC_API_ENDPOINTS.production;
}

export function getSologenicDexUrl(environment: string, customUrl?: string): string {
  if (environment === 'custom' && customUrl) {
    return customUrl;
  }
  return SOLOGENIC_DEX_ENDPOINTS[environment as keyof typeof SOLOGENIC_DEX_ENDPOINTS] || SOLOGENIC_DEX_ENDPOINTS.production;
}
