/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getSologenicDexUrl } from '../constants/networks';

export interface DexClientConfig {
  dexEnvironment: string;
  customDexUrl?: string;
  tradingApiKey?: string;
  tradingWalletAddress?: string;
  walletSeed?: string;
  maxSlippage?: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price?: string;
  amount: string;
  filled: string;
  remaining: string;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  createdAt: number;
  updatedAt: number;
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: string;
  amount: string;
  fee: string;
  timestamp: number;
}

export interface TradingPair {
  symbol: string;
  base: string;
  quote: string;
  minAmount: string;
  maxAmount: string;
  pricePrecision: number;
  amountPrecision: number;
}

export class DexClient {
  private client: AxiosInstance;
  private walletAddress?: string;

  constructor(config: DexClientConfig) {
    const baseURL = getSologenicDexUrl(config.dexEnvironment, config.customDexUrl);
    this.walletAddress = config.tradingWalletAddress;

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.tradingApiKey && { 'X-Trading-Key': config.tradingApiKey }),
      },
    });
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const data = error.response.data as { message?: string; error?: string };
      throw new Error(data.message || data.error || `DEX Error: ${error.response.status}`);
    }
    throw new Error(error.message || 'Network error');
  }

  async placeOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'limit' | 'market';
    amount: string;
    price?: string;
  }): Promise<Order> {
    try {
      const response = await this.client.post('/api/v1/orders', {
        ...params,
        address: this.walletAddress,
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; order: Order }> {
    try {
      const response = await this.client.delete(`/api/v1/orders/${orderId}`, {
        data: { address: this.walletAddress },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<{ success: boolean; cancelled: number }> {
    try {
      const response = await this.client.delete('/api/v1/orders', {
        data: { address: this.walletAddress, symbol },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    try {
      const response = await this.client.get(`/api/v1/orders/${orderId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    try {
      const response = await this.client.get('/api/v1/orders', {
        params: { address: this.walletAddress, symbol, status: 'open' },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getOrderHistory(symbol?: string, limit = 50): Promise<Order[]> {
    try {
      const response = await this.client.get('/api/v1/orders/history', {
        params: { address: this.walletAddress, symbol, limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getTradeHistory(symbol?: string, limit = 50): Promise<Trade[]> {
    try {
      const response = await this.client.get('/api/v1/trades', {
        params: { address: this.walletAddress, symbol, limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getTradingPairs(): Promise<TradingPair[]> {
    try {
      const response = await this.client.get('/api/v1/pairs');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getTradingPair(symbol: string): Promise<TradingPair> {
    try {
      const response = await this.client.get(`/api/v1/pairs/${symbol}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}

export async function withDexClient<T>(
  config: DexClientConfig,
  callback: (client: DexClient) => Promise<T>,
): Promise<T> {
  const client = new DexClient(config);
  return await callback(client);
}
