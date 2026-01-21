/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';

export interface PriceChange {
  absolute: string;
  percentage: string;
  direction: 'up' | 'down' | 'unchanged';
}

export interface OHLC {
  open: string;
  high: string;
  low: string;
  close: string;
}

export function calculatePriceChange(currentPrice: string, previousPrice: string): PriceChange {
  const current = new BigNumber(currentPrice);
  const previous = new BigNumber(previousPrice);

  if (previous.isZero()) {
    return { absolute: '0', percentage: '0', direction: 'unchanged' };
  }

  const absolute = current.minus(previous);
  const percentage = absolute.dividedBy(previous).multipliedBy(100);

  let direction: 'up' | 'down' | 'unchanged';
  if (absolute.isGreaterThan(0)) {
    direction = 'up';
  } else if (absolute.isLessThan(0)) {
    direction = 'down';
  } else {
    direction = 'unchanged';
  }

  return {
    absolute: absolute.toString(),
    percentage: percentage.toFixed(4),
    direction,
  };
}

export function calculateVWAP(trades: { price: string; amount: string }[]): string {
  if (trades.length === 0) return '0';

  let totalValue = new BigNumber(0);
  let totalVolume = new BigNumber(0);

  for (const trade of trades) {
    const price = new BigNumber(trade.price);
    const amount = new BigNumber(trade.amount);
    totalValue = totalValue.plus(price.multipliedBy(amount));
    totalVolume = totalVolume.plus(amount);
  }

  if (totalVolume.isZero()) return '0';
  return totalValue.dividedBy(totalVolume).toString();
}

export function calculateMovingAverage(prices: string[], period: number): string {
  if (prices.length === 0 || period <= 0) return '0';

  const relevantPrices = prices.slice(-period);
  const sum = relevantPrices.reduce((acc, price) => acc.plus(price), new BigNumber(0));

  return sum.dividedBy(relevantPrices.length).toString();
}

export function calculateSpread(bestBid: string, bestAsk: string): {
  absolute: string;
  percentage: string;
  midPrice: string;
} {
  const bid = new BigNumber(bestBid);
  const ask = new BigNumber(bestAsk);

  const absolute = ask.minus(bid);
  const midPrice = bid.plus(ask).dividedBy(2);

  let percentage = '0';
  if (!midPrice.isZero()) {
    percentage = absolute.dividedBy(midPrice).multipliedBy(100).toFixed(4);
  }

  return {
    absolute: absolute.toString(),
    percentage,
    midPrice: midPrice.toString(),
  };
}

export function aggregateOHLC(prices: { timestamp: number; price: string }[]): OHLC | null {
  if (prices.length === 0) return null;

  const sortedPrices = [...prices].sort((a, b) => a.timestamp - b.timestamp);
  const priceValues = sortedPrices.map((p) => new BigNumber(p.price));

  const open = priceValues[0].toString();
  const close = priceValues[priceValues.length - 1].toString();
  const high = BigNumber.max(...priceValues).toString();
  const low = BigNumber.min(...priceValues).toString();

  return { open, high, low, close };
}

export function formatPrice(price: string | number, decimals = 8): string {
  return new BigNumber(price).toFixed(decimals);
}

export function formatVolume(volume: string | number, decimals = 2): string {
  const vol = new BigNumber(volume);
  if (vol.isGreaterThanOrEqualTo(1000000000)) {
    return vol.dividedBy(1000000000).toFixed(decimals) + 'B';
  }
  if (vol.isGreaterThanOrEqualTo(1000000)) {
    return vol.dividedBy(1000000).toFixed(decimals) + 'M';
  }
  if (vol.isGreaterThanOrEqualTo(1000)) {
    return vol.dividedBy(1000).toFixed(decimals) + 'K';
  }
  return vol.toFixed(decimals);
}
