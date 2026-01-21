/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { SOLO_TOKEN } from '../constants/tokens';

export interface TrustlineInfo {
  currency: string;
  issuer: string;
  balance: string;
  limit: string;
  limitPeer: string;
  qualityIn: number;
  qualityOut: number;
  noRipple: boolean;
  noRipplePeer: boolean;
  freeze: boolean;
  freezePeer: boolean;
}

export interface FormattedTrustline {
  currency: string;
  issuer: string;
  balance: string;
  limit: string;
  isSolo: boolean;
  isPositiveBalance: boolean;
}

export function formatTrustline(trustline: TrustlineInfo): FormattedTrustline {
  const balance = parseFloat(trustline.balance);
  return {
    currency: trustline.currency,
    issuer: trustline.issuer,
    balance: trustline.balance,
    limit: trustline.limit,
    isSolo: trustline.currency === SOLO_TOKEN.currency && trustline.issuer === SOLO_TOKEN.issuer,
    isPositiveBalance: balance > 0,
  };
}

export function filterTrustlines(
  trustlines: TrustlineInfo[],
  options: {
    currency?: string;
    issuer?: string;
    onlyPositiveBalance?: boolean;
    onlySolo?: boolean;
  },
): TrustlineInfo[] {
  return trustlines.filter((tl) => {
    if (options.currency && tl.currency !== options.currency) return false;
    if (options.issuer && tl.issuer !== options.issuer) return false;
    if (options.onlyPositiveBalance && parseFloat(tl.balance) <= 0) return false;
    if (options.onlySolo) {
      if (tl.currency !== SOLO_TOKEN.currency || tl.issuer !== SOLO_TOKEN.issuer) return false;
    }
    return true;
  });
}

export function createTrustlineTransaction(params: {
  account: string;
  currency: string;
  issuer: string;
  limit: string;
  fee?: string;
  sequence?: number;
}): object {
  return {
    TransactionType: 'TrustSet',
    Account: params.account,
    LimitAmount: {
      currency: params.currency,
      issuer: params.issuer,
      value: params.limit,
    },
    ...(params.fee && { Fee: params.fee }),
    ...(params.sequence !== undefined && { Sequence: params.sequence }),
  };
}

export function createSoloTrustlineTransaction(params: {
  account: string;
  limit?: string;
  fee?: string;
  sequence?: number;
}): object {
  return createTrustlineTransaction({
    account: params.account,
    currency: SOLO_TOKEN.currency,
    issuer: SOLO_TOKEN.issuer,
    limit: params.limit || '1000000000',
    fee: params.fee,
    sequence: params.sequence,
  });
}

export function removeTrustlineTransaction(params: {
  account: string;
  currency: string;
  issuer: string;
  fee?: string;
  sequence?: number;
}): object {
  return createTrustlineTransaction({
    ...params,
    limit: '0',
  });
}

export function validateTrustlineRemoval(trustline: TrustlineInfo): { canRemove: boolean; reason?: string } {
  const balance = parseFloat(trustline.balance);
  if (balance !== 0) {
    return {
      canRemove: false,
      reason: `Cannot remove trustline with non-zero balance: ${trustline.balance}`,
    };
  }
  return { canRemove: true };
}
