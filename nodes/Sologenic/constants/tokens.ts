/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export const SOLO_TOKEN = {
  currency: 'SOLO',
  issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
  name: 'Sologenic',
  decimals: 15,
} as const;

export const KNOWN_ISSUERS = {
  SOLO: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
  // Tokenized stocks issuer
  STOCKS: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
  // Tokenized ETFs issuer
  ETFS: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
  // Tokenized commodities issuer
  COMMODITIES: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
} as const;

export const NFT_ADDRESSES = {
  marketplace: 'rNFTMarketplaceAddress',
  minter: 'rNFTMinterAddress',
} as const;

export const STAKING_ADDRESSES = {
  stakingPool: 'rStakingPoolAddress',
  rewardsPool: 'rRewardsPoolAddress',
} as const;

export interface TokenInfo {
  currency: string;
  issuer: string;
  name: string;
  decimals: number;
}

export function isSoloToken(currency: string, issuer: string): boolean {
  return currency === SOLO_TOKEN.currency && issuer === SOLO_TOKEN.issuer;
}

export function formatCurrencyCode(currency: string): string {
  if (currency === 'XRP') {
    return 'XRP';
  }
  // Handle hex-encoded currencies (longer than 3 chars)
  if (currency.length > 3) {
    try {
      const decoded = Buffer.from(currency, 'hex').toString('utf8').replace(/\0/g, '');
      return decoded || currency;
    } catch {
      return currency;
    }
  }
  return currency;
}
