/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';

// XRPL constants
export const BASE_RESERVE = 10; // XRP
export const OWNER_RESERVE = 2; // XRP per owned object
export const REFERENCE_TX_COST = 10; // drops

export interface ReserveInfo {
  baseReserve: string;
  ownerReserve: string;
  totalReserve: string;
  availableBalance: string;
}

export function calculateReserve(ownerCount: number): ReserveInfo {
  const base = new BigNumber(BASE_RESERVE);
  const ownerTotal = new BigNumber(OWNER_RESERVE).multipliedBy(ownerCount);
  const total = base.plus(ownerTotal);

  return {
    baseReserve: base.toString(),
    ownerReserve: ownerTotal.toString(),
    totalReserve: total.toString(),
    availableBalance: '0', // Will be calculated with actual balance
  };
}

export function calculateAvailableBalance(balance: string, ownerCount: number): string {
  const balanceBN = new BigNumber(balance);
  const reserve = calculateReserve(ownerCount);
  const available = balanceBN.minus(reserve.totalReserve);
  return available.isGreaterThan(0) ? available.toString() : '0';
}

export interface FeeEstimate {
  baseFee: string;
  openLedgerFee: string;
  medianFee: string;
  recommendedFee: string;
}

export function estimateFee(
  serverInfo?: { validated_ledger?: { base_fee_xrp?: number } },
): FeeEstimate {
  const baseFeeXrp = serverInfo?.validated_ledger?.base_fee_xrp || 0.00001;
  const baseFeeDrops = new BigNumber(baseFeeXrp).multipliedBy(1000000).toString();

  // Conservative estimates
  const openLedgerFee = new BigNumber(baseFeeDrops).multipliedBy(1.5).integerValue().toString();
  const medianFee = new BigNumber(baseFeeDrops).multipliedBy(2).integerValue().toString();
  const recommendedFee = new BigNumber(baseFeeDrops).multipliedBy(1.2).integerValue().toString();

  return {
    baseFee: baseFeeDrops,
    openLedgerFee,
    medianFee,
    recommendedFee,
  };
}

export function dropsToXrp(drops: string | number): string {
  return new BigNumber(drops).dividedBy(1000000).toString();
}

export function xrpToDrops(xrp: string | number): string {
  return new BigNumber(xrp).multipliedBy(1000000).integerValue().toString();
}

export interface TradingFee {
  makerFee: string;
  takerFee: string;
  feePercentage: string;
}

export function calculateTradingFee(
  amount: string,
  feePercentage = 0.1,
): TradingFee {
  const amountBN = new BigNumber(amount);
  const feePercent = new BigNumber(feePercentage).dividedBy(100);
  const fee = amountBN.multipliedBy(feePercent);

  return {
    makerFee: '0', // Makers typically don't pay fees
    takerFee: fee.toString(),
    feePercentage: feePercentage.toString(),
  };
}

export function calculateNetAmount(
  amount: string,
  feePercentage = 0.1,
  side: 'buy' | 'sell',
): { grossAmount: string; fee: string; netAmount: string } {
  const amountBN = new BigNumber(amount);
  const feePercent = new BigNumber(feePercentage).dividedBy(100);
  const fee = amountBN.multipliedBy(feePercent);

  let netAmount: BigNumber;
  if (side === 'buy') {
    // Buying: you pay more
    netAmount = amountBN.plus(fee);
  } else {
    // Selling: you receive less
    netAmount = amountBN.minus(fee);
  }

  return {
    grossAmount: amount,
    fee: fee.toString(),
    netAmount: netAmount.toString(),
  };
}
