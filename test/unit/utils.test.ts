/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  calculatePriceChange,
  calculateVWAP,
  calculateMovingAverage,
  calculateSpread,
  formatPrice,
  formatVolume,
} from '../../nodes/Sologenic/utils/priceUtils';

import {
  calculateReserve,
  calculateAvailableBalance,
  estimateFee,
  dropsToXrp,
  xrpToDrops,
  calculateTradingFee,
  calculateNetAmount,
} from '../../nodes/Sologenic/utils/feeUtils';

import {
  formatTrustline,
  filterTrustlines,
  validateTrustlineRemoval,
  TrustlineInfo,
} from '../../nodes/Sologenic/utils/trustlineUtils';

import {
  parseXrplAmount,
  parseOffer,
  calculateOfferPrice,
  XrplOffer,
} from '../../nodes/Sologenic/utils/offerUtils';

describe('Price Utilities', () => {
  describe('calculatePriceChange', () => {
    it('should calculate positive price change', () => {
      const result = calculatePriceChange('110', '100');
      expect(result.direction).toBe('up');
      expect(result.absolute).toBe('10');
      expect(parseFloat(result.percentage)).toBeCloseTo(10, 2);
    });

    it('should calculate negative price change', () => {
      const result = calculatePriceChange('90', '100');
      expect(result.direction).toBe('down');
      expect(result.absolute).toBe('-10');
      expect(parseFloat(result.percentage)).toBeCloseTo(-10, 2);
    });

    it('should handle unchanged price', () => {
      const result = calculatePriceChange('100', '100');
      expect(result.direction).toBe('unchanged');
      expect(result.absolute).toBe('0');
      expect(result.percentage).toBe('0.0000');
    });

    it('should handle zero previous price', () => {
      const result = calculatePriceChange('100', '0');
      expect(result.direction).toBe('unchanged');
      expect(result.absolute).toBe('0');
    });
  });

  describe('calculateVWAP', () => {
    it('should calculate volume weighted average price', () => {
      const trades = [
        { price: '100', amount: '10' },
        { price: '110', amount: '20' },
      ];
      const vwap = calculateVWAP(trades);
      // (100*10 + 110*20) / (10+20) = 3200/30 = 106.666...
      expect(parseFloat(vwap)).toBeCloseTo(106.67, 1);
    });

    it('should return 0 for empty trades', () => {
      expect(calculateVWAP([])).toBe('0');
    });

    it('should handle single trade', () => {
      const trades = [{ price: '50', amount: '100' }];
      expect(calculateVWAP(trades)).toBe('50');
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate moving average for given period', () => {
      const prices = ['10', '20', '30', '40', '50'];
      const ma = calculateMovingAverage(prices, 3);
      // Average of last 3: (30+40+50)/3 = 40
      expect(parseFloat(ma)).toBeCloseTo(40, 2);
    });

    it('should handle period larger than array', () => {
      const prices = ['10', '20'];
      const ma = calculateMovingAverage(prices, 5);
      // Average of all: (10+20)/2 = 15
      expect(parseFloat(ma)).toBeCloseTo(15, 2);
    });

    it('should return 0 for empty array', () => {
      expect(calculateMovingAverage([], 5)).toBe('0');
    });

    it('should return 0 for zero period', () => {
      expect(calculateMovingAverage(['10', '20'], 0)).toBe('0');
    });
  });

  describe('calculateSpread', () => {
    it('should calculate spread correctly', () => {
      const result = calculateSpread('99', '101');
      expect(result.absolute).toBe('2');
      expect(result.midPrice).toBe('100');
      expect(parseFloat(result.percentage)).toBeCloseTo(2, 2);
    });

    it('should handle zero midPrice', () => {
      const result = calculateSpread('0', '0');
      expect(result.percentage).toBe('0');
    });
  });

  describe('formatPrice', () => {
    it('should format price with default decimals', () => {
      expect(formatPrice('1.234567891234')).toBe('1.23456789');
    });

    it('should format price with custom decimals', () => {
      expect(formatPrice('1.234567891234', 4)).toBe('1.2346');
    });
  });

  describe('formatVolume', () => {
    it('should format billions', () => {
      expect(formatVolume('1500000000')).toBe('1.50B');
    });

    it('should format millions', () => {
      expect(formatVolume('1500000')).toBe('1.50M');
    });

    it('should format thousands', () => {
      expect(formatVolume('1500')).toBe('1.50K');
    });

    it('should format small numbers', () => {
      expect(formatVolume('150')).toBe('150.00');
    });
  });
});

describe('Fee Utilities', () => {
  describe('calculateReserve', () => {
    it('should calculate reserve for 0 owned objects', () => {
      const result = calculateReserve(0);
      expect(result.baseReserve).toBe('10');
      expect(result.ownerReserve).toBe('0');
      expect(result.totalReserve).toBe('10');
    });

    it('should calculate reserve for multiple owned objects', () => {
      const result = calculateReserve(5);
      expect(result.baseReserve).toBe('10');
      expect(result.ownerReserve).toBe('10'); // 5 * 2
      expect(result.totalReserve).toBe('20'); // 10 + 10
    });
  });

  describe('calculateAvailableBalance', () => {
    it('should calculate available balance', () => {
      // Balance 100, 5 objects = 20 reserve, available = 80
      const available = calculateAvailableBalance('100', 5);
      expect(available).toBe('80');
    });

    it('should return 0 for insufficient balance', () => {
      // Balance 10, 5 objects = 20 reserve, available = 0 (not negative)
      const available = calculateAvailableBalance('10', 5);
      expect(available).toBe('0');
    });
  });

  describe('estimateFee', () => {
    it('should estimate fee without server info', () => {
      const fee = estimateFee();
      expect(fee.baseFee).toBeDefined();
      expect(fee.openLedgerFee).toBeDefined();
      expect(fee.medianFee).toBeDefined();
      expect(fee.recommendedFee).toBeDefined();
    });

    it('should estimate fee with server info', () => {
      const serverInfo = {
        validated_ledger: { base_fee_xrp: 0.00001 },
      };
      const fee = estimateFee(serverInfo);
      expect(fee.baseFee).toBe('10'); // 0.00001 * 1000000 = 10 drops
    });
  });

  describe('dropsToXrp', () => {
    it('should convert drops to XRP', () => {
      expect(dropsToXrp('1000000')).toBe('1');
      expect(dropsToXrp('500000')).toBe('0.5');
    });
  });

  describe('xrpToDrops', () => {
    it('should convert XRP to drops', () => {
      expect(xrpToDrops('1')).toBe('1000000');
      expect(xrpToDrops('0.5')).toBe('500000');
    });
  });

  describe('calculateTradingFee', () => {
    it('should calculate trading fee', () => {
      const fee = calculateTradingFee('1000', 0.1);
      expect(fee.makerFee).toBe('0');
      expect(fee.takerFee).toBe('1'); // 1000 * 0.1%
      expect(fee.feePercentage).toBe('0.1');
    });
  });

  describe('calculateNetAmount', () => {
    it('should calculate net amount for buy', () => {
      const result = calculateNetAmount('100', 0.1, 'buy');
      expect(result.grossAmount).toBe('100');
      expect(result.fee).toBe('0.1');
      expect(result.netAmount).toBe('100.1'); // pay more when buying
    });

    it('should calculate net amount for sell', () => {
      const result = calculateNetAmount('100', 0.1, 'sell');
      expect(result.grossAmount).toBe('100');
      expect(result.fee).toBe('0.1');
      expect(result.netAmount).toBe('99.9'); // receive less when selling
    });
  });
});

describe('Trustline Utilities', () => {
  const mockTrustline: TrustlineInfo = {
    currency: 'SOLO',
    issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
    balance: '1000',
    limit: '1000000000',
    limitPeer: '0',
    qualityIn: 0,
    qualityOut: 0,
    noRipple: true,
    noRipplePeer: false,
    freeze: false,
    freezePeer: false,
  };

  describe('formatTrustline', () => {
    it('should format trustline correctly', () => {
      const formatted = formatTrustline(mockTrustline);
      expect(formatted.currency).toBe(mockTrustline.currency);
      expect(formatted.issuer).toBe(mockTrustline.issuer);
      expect(formatted.balance).toBe('1000');
      expect(formatted.isSolo).toBe(true);
      expect(formatted.isPositiveBalance).toBe(true);
    });

    it('should detect negative balance', () => {
      const negativeBalanceTrustline: TrustlineInfo = {
        ...mockTrustline,
        balance: '-100',
      };
      const formatted = formatTrustline(negativeBalanceTrustline);
      expect(formatted.isPositiveBalance).toBe(false);
    });
  });

  describe('filterTrustlines', () => {
    const trustlines: TrustlineInfo[] = [
      mockTrustline,
      {
        ...mockTrustline,
        currency: 'USD',
        issuer: 'rUSD...',
        balance: '0',
      },
    ];

    it('should filter by currency', () => {
      const filtered = filterTrustlines(trustlines, { currency: 'USD' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].currency).toBe('USD');
    });

    it('should filter by positive balance', () => {
      const filtered = filterTrustlines(trustlines, { onlyPositiveBalance: true });
      expect(filtered.length).toBe(1);
      expect(filtered[0].balance).toBe('1000');
    });

    it('should filter SOLO trustlines', () => {
      const filtered = filterTrustlines(trustlines, { onlySolo: true });
      expect(filtered.length).toBe(1);
    });
  });

  describe('validateTrustlineRemoval', () => {
    it('should allow removal of zero-balance trustline', () => {
      const result = validateTrustlineRemoval({ ...mockTrustline, balance: '0' });
      expect(result.canRemove).toBe(true);
    });

    it('should prevent removal of non-zero-balance trustline', () => {
      const result = validateTrustlineRemoval(mockTrustline);
      expect(result.canRemove).toBe(false);
      expect(result.reason).toContain('non-zero balance');
    });
  });
});

describe('Offer Utilities', () => {
  describe('parseXrplAmount', () => {
    it('should parse XRP drops to XRP', () => {
      const result = parseXrplAmount('1000000');
      expect(result.currency).toBe('XRP');
      expect(result.value).toBe('1');
    });

    it('should parse issued currency', () => {
      const result = parseXrplAmount({
        currency: 'USD',
        issuer: 'rUSD...',
        value: '100',
      });
      expect(result.currency).toBe('USD');
      expect(result.issuer).toBe('rUSD...');
      expect(result.value).toBe('100');
    });
  });

  describe('parseOffer', () => {
    it('should parse sell offer', () => {
      const offer: XrplOffer = {
        seq: 1,
        flags: 0,
        taker_gets: '10000000', // 10 XRP
        taker_pays: { currency: 'USD', issuer: 'rUSD...', value: '20' },
      };
      const result = parseOffer(offer, 'XRP');
      expect(result.side).toBe('sell');
      expect(result.amount).toBe('10');
      expect(result.total).toBe('20');
    });

    it('should parse buy offer', () => {
      const offer: XrplOffer = {
        seq: 2,
        flags: 0,
        taker_gets: { currency: 'USD', issuer: 'rUSD...', value: '20' },
        taker_pays: '10000000', // 10 XRP
      };
      const result = parseOffer(offer, 'XRP');
      expect(result.side).toBe('buy');
    });
  });

  describe('calculateOfferPrice', () => {
    it('should calculate offer price correctly', () => {
      const price = calculateOfferPrice({ value: '100' }, { value: '200' });
      expect(price).toBe('2');
    });

    it('should return 0 for zero taker_gets', () => {
      const price = calculateOfferPrice({ value: '0' }, { value: '100' });
      expect(price).toBe('0');
    });
  });
});
