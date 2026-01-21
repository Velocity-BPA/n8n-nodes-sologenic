/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';

export interface XrplOffer {
  seq: number;
  flags: number;
  taker_gets: string | { currency: string; issuer: string; value: string };
  taker_pays: string | { currency: string; issuer: string; value: string };
  quality?: string;
  expiration?: number;
}

export interface ParsedOffer {
  sequence: number;
  side: 'buy' | 'sell';
  price: string;
  amount: string;
  total: string;
  takerGets: { currency: string; issuer?: string; value: string };
  takerPays: { currency: string; issuer?: string; value: string };
}

export function parseXrplAmount(amount: string | { currency: string; issuer: string; value: string }): {
  currency: string;
  issuer?: string;
  value: string;
} {
  if (typeof amount === 'string') {
    // XRP is represented as drops (string)
    const xrpValue = new BigNumber(amount).dividedBy(1000000).toString();
    return { currency: 'XRP', value: xrpValue };
  }
  return {
    currency: amount.currency,
    issuer: amount.issuer,
    value: amount.value,
  };
}

export function parseOffer(offer: XrplOffer, baseCurrency: string): ParsedOffer {
  const takerGets = parseXrplAmount(offer.taker_gets);
  const takerPays = parseXrplAmount(offer.taker_pays);

  // Determine side based on what currency the taker gets
  const side = takerGets.currency === baseCurrency ? 'sell' : 'buy';

  let price: string;
  let amount: string;
  let total: string;

  if (side === 'sell') {
    // Selling base currency
    amount = takerGets.value;
    total = takerPays.value;
    price = new BigNumber(total).dividedBy(amount).toString();
  } else {
    // Buying base currency
    amount = takerPays.value;
    total = takerGets.value;
    price = new BigNumber(total).dividedBy(amount).toString();
  }

  return {
    sequence: offer.seq,
    side,
    price,
    amount,
    total,
    takerGets,
    takerPays,
  };
}

export function calculateOfferPrice(
  takerGets: { value: string },
  takerPays: { value: string },
): string {
  const gets = new BigNumber(takerGets.value);
  const pays = new BigNumber(takerPays.value);
  if (gets.isZero()) return '0';
  return pays.dividedBy(gets).toString();
}

export function createOfferTransaction(params: {
  account: string;
  takerGets: string | { currency: string; issuer: string; value: string };
  takerPays: string | { currency: string; issuer: string; value: string };
  expiration?: number;
  offerSequence?: number;
  fee?: string;
  sequence?: number;
}): object {
  return {
    TransactionType: 'OfferCreate',
    Account: params.account,
    TakerGets: params.takerGets,
    TakerPays: params.takerPays,
    ...(params.expiration && { Expiration: params.expiration }),
    ...(params.offerSequence && { OfferSequence: params.offerSequence }),
    ...(params.fee && { Fee: params.fee }),
    ...(params.sequence !== undefined && { Sequence: params.sequence }),
  };
}

export function cancelOfferTransaction(params: {
  account: string;
  offerSequence: number;
  fee?: string;
  sequence?: number;
}): object {
  return {
    TransactionType: 'OfferCancel',
    Account: params.account,
    OfferSequence: params.offerSequence,
    ...(params.fee && { Fee: params.fee }),
    ...(params.sequence !== undefined && { Sequence: params.sequence }),
  };
}
