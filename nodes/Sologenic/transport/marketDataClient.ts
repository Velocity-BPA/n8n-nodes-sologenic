/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import axios, { AxiosInstance } from 'axios';
import { SOLOGENIC_API_ENDPOINTS } from '../constants/networks';

export interface MarketDataConfig {
  apiEndpoint: 'production' | 'sandbox' | 'custom';
  customApiUrl?: string;
  apiKey?: string;
}

export interface Ticker {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
  changePercent24h: number;
  timestamp: number;
}

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStats {
  totalVolume24h: number;
  totalTrades24h: number;
  totalMarkets: number;
  topGainers: Array<{ symbol: string; change: number }>;
  topLosers: Array<{ symbol: string; change: number }>;
}

export interface TopMover {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
}

export class MarketDataClient {
  private client: AxiosInstance;

  constructor(config: MarketDataConfig) {
    const baseURL = this.getBaseUrl(config);

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
      },
    });
  }

  private getBaseUrl(config: MarketDataConfig): string {
    if (config.apiEndpoint === 'custom' && config.customApiUrl) {
      return config.customApiUrl;
    }
    const endpoints: Record<string, string> = SOLOGENIC_API_ENDPOINTS;
    return endpoints[config.apiEndpoint] || SOLOGENIC_API_ENDPOINTS.production;
  }

  private async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(endpoint, { params });
    return response.data;
  }

  async getTicker(symbol: string): Promise<Ticker> {
    return this.get<Ticker>(`/api/v1/market/ticker/${symbol}`);
  }

  async getAllTickers(): Promise<Ticker[]> {
    return this.get<Ticker[]>('/api/v1/market/tickers');
  }

  async getOHLCV(
    symbol: string,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' = '1h',
    limit: number = 100,
    startTime?: number,
    endTime?: number,
  ): Promise<OHLCV[]> {
    return this.get<OHLCV[]>(`/api/v1/market/ohlcv/${symbol}`, {
      interval,
      limit,
      startTime,
      endTime,
    });
  }

  async getMarketStats(): Promise<MarketStats> {
    return this.get<MarketStats>('/api/v1/market/stats');
  }

  async getTopGainers(limit: number = 10): Promise<TopMover[]> {
    return this.get<TopMover[]>('/api/v1/market/top-gainers', { limit });
  }

  async getTopLosers(limit: number = 10): Promise<TopMover[]> {
    return this.get<TopMover[]>('/api/v1/market/top-losers', { limit });
  }

  async get24hVolume(): Promise<{ totalVolume: number; byAsset: Record<string, number> }> {
    return this.get('/api/v1/market/volume/24h');
  }

  async getTradeHistory(
    symbol: string,
    limit: number = 50,
  ): Promise<
    Array<{
      id: string;
      price: number;
      amount: number;
      side: 'buy' | 'sell';
      timestamp: number;
    }>
  > {
    return this.get(`/api/v1/market/trades/${symbol}`, { limit });
  }

  async getMarketDepth(
    symbol: string,
    limit: number = 20,
  ): Promise<{
    bids: Array<{ price: number; amount: number }>;
    asks: Array<{ price: number; amount: number }>;
  }> {
    return this.get(`/api/v1/market/depth/${symbol}`, { limit });
  }

  async getSpread(symbol: string): Promise<{
    symbol: string;
    bid: number;
    ask: number;
    spread: number;
    spreadPercent: number;
  }> {
    return this.get(`/api/v1/market/spread/${symbol}`);
  }

  static fromCredentials(credentials: {
    apiEndpoint: string;
    customApiUrl?: string;
    apiKey?: string;
  }): MarketDataClient {
    return new MarketDataClient({
      apiEndpoint: credentials.apiEndpoint as 'production' | 'sandbox' | 'custom',
      customApiUrl: credentials.customApiUrl,
      apiKey: credentials.apiKey,
    });
  }
}

export async function withMarketDataClient<T>(
  credentials: { apiEndpoint: string; customApiUrl?: string; apiKey?: string },
  operation: (client: MarketDataClient) => Promise<T>,
): Promise<T> {
  const client = MarketDataClient.fromCredentials(credentials);
  return operation(client);
}
