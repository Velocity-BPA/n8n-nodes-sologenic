/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { SOLO_TOKEN } from './tokens';

export interface TradingPair {
  symbol: string;
  base: {
    currency: string;
    issuer?: string;
  };
  quote: {
    currency: string;
    issuer?: string;
  };
}

export const COMMON_TRADING_PAIRS: TradingPair[] = [
  {
    symbol: 'SOLO/XRP',
    base: { currency: SOLO_TOKEN.currency, issuer: SOLO_TOKEN.issuer },
    quote: { currency: 'XRP' },
  },
  {
    symbol: 'XRP/USD',
    base: { currency: 'XRP' },
    quote: { currency: 'USD', issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq' },
  },
];

export function parseSymbol(symbol: string): { base: string; quote: string } {
  const [base, quote] = symbol.split('/');
  return { base: base || '', quote: quote || '' };
}

export function formatSymbol(base: string, quote: string): string {
  return `${base}/${quote}`;
}

export function encodeCurrency(currency: string): string {
  if (currency === 'XRP') {
    return 'XRP';
  }
  if (currency.length <= 3) {
    return currency.padEnd(3, ' ').toUpperCase();
  }
  // Encode as hex for longer currency codes
  return Buffer.from(currency.padEnd(20, '\0')).toString('hex').toUpperCase();
}

export function decodeCurrency(encoded: string): string {
  if (encoded === 'XRP') {
    return 'XRP';
  }
  if (encoded.length === 3) {
    return encoded.trim();
  }
  // Decode from hex
  try {
    return Buffer.from(encoded, 'hex').toString('utf8').replace(/\0/g, '').trim();
  } catch {
    return encoded;
  }
}
