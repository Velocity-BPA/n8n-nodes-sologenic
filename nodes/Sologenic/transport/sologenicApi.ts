/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getSologenicApiUrl } from '../constants/networks';

export interface SologenicApiConfig {
  apiEndpoint: string;
  customApiUrl?: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface MarketTicker {
  symbol: string;
  price: string;
  volume24h: string;
  change24h: string;
  high24h: string;
  low24h: string;
  timestamp: number;
}

export interface OrderBookLevel {
  price: string;
  amount: string;
  total: string;
}

export interface OrderBookData {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface OHLCVData {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface AssetInfo {
  symbol: string;
  name: string;
  type: string;
  issuer: string;
  currency: string;
  price?: string;
  marketCap?: string;
}

export class SologenicApiClient {
  private client: AxiosInstance;

  constructor(config: SologenicApiConfig) {
    const baseURL = getSologenicApiUrl(config.apiEndpoint, config.customApiUrl);
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        ...(config.apiSecret && { 'X-API-Secret': config.apiSecret }),
      },
    });
  }

  static fromCredentials(credentials: {
    apiEndpoint: string;
    customApiUrl?: string;
    apiKey: string;
    apiSecret: string;
  }): SologenicApiClient {
    return new SologenicApiClient({
      apiEndpoint: credentials.apiEndpoint,
      customApiUrl: credentials.customApiUrl,
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
    });
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const data = error.response.data as { message?: string; error?: string };
      throw new Error(data.message || data.error || `API Error: ${error.response.status}`);
    }
    throw new Error(error.message || 'Network error');
  }

  async getHealth(): Promise<{ status: string }> {
    try {
      const response = await this.client.get('/api/v1/health');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getTicker(symbol: string): Promise<MarketTicker> {
    try {
      const response = await this.client.get(`/api/v1/ticker/${symbol}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getAllTickers(): Promise<MarketTicker[]> {
    try {
      const response = await this.client.get('/api/v1/tickers');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getOrderBook(symbol: string, depth = 20): Promise<OrderBookData> {
    try {
      const response = await this.client.get(`/api/v1/orderbook/${symbol}`, {
        params: { depth },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getOHLCV(symbol: string, interval = '1h', limit = 100): Promise<OHLCVData[]> {
    try {
      const response = await this.client.get(`/api/v1/ohlcv/${symbol}`, {
        params: { interval, limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getAssets(type?: string, limit = 100): Promise<AssetInfo[]> {
    try {
      const response = await this.client.get('/api/v1/assets', {
        params: { type, limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getAsset(symbol: string): Promise<AssetInfo> {
    try {
      const response = await this.client.get(`/api/v1/assets/${symbol}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async searchAssets(query: string, limit = 50): Promise<AssetInfo[]> {
    try {
      const response = await this.client.get('/api/v1/assets/search', {
        params: { q: query, limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getSoloPrice(): Promise<{ price: string; change24h: string }> {
    try {
      const response = await this.client.get('/api/v1/solo/price');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getSoloMarketData(): Promise<MarketTicker> {
    try {
      const response = await this.client.get('/api/v1/solo/market');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getTopGainers(limit = 10): Promise<MarketTicker[]> {
    try {
      const response = await this.client.get('/api/v1/market/gainers', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getTopLosers(limit = 10): Promise<MarketTicker[]> {
    try {
      const response = await this.client.get('/api/v1/market/losers', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getNftCollection(collectionId: string): Promise<unknown> {
    try {
      const response = await this.client.get(`/api/v1/nft/collections/${collectionId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getNft(nftId: string): Promise<unknown> {
    try {
      const response = await this.client.get(`/api/v1/nft/${nftId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getStakingPools(): Promise<unknown[]> {
    try {
      const response = await this.client.get('/api/v1/staking/pools');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getAddressStakingInfo(address: string): Promise<unknown> {
    try {
      const response = await this.client.get(`/api/v1/staking/${address}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getStakingRewards(address: string): Promise<unknown> {
    try {
      const response = await this.client.get(`/api/v1/staking/${address}/rewards`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getAssetDetails(symbol: string): Promise<AssetInfo> {
    return this.getAsset(symbol);
  }

  async getNftCollections(limit = 20): Promise<unknown[]> {
    try {
      const response = await this.client.get('/api/v1/nft/collections', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getCollectionNfts(collectionId: string, limit = 20, offset = 0): Promise<unknown[]> {
    try {
      const response = await this.client.get(`/api/v1/nft/collections/${collectionId}/nfts`, {
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getStakingInfo(): Promise<{
    totalStaked: number;
    apy: number;
    pools: Array<{ id: string; name: string; apy: number; minStake: number; lockPeriod: number; totalStaked: number }>;
  }> {
    try {
      const response = await this.client.get('/api/v1/staking/info');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getPortfolio(address: string): Promise<{
    address: string;
    totalValue: number;
    holdings: Array<{ asset: string; balance: number; value: number; change24h: number }>;
    performance: { day: number; week: number; month: number; year: number };
  }> {
    try {
      const response = await this.client.get(`/api/v1/portfolio/${address}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}

export async function withSologenicApi<T>(
  config: SologenicApiConfig,
  callback: (client: SologenicApiClient) => Promise<T>,
): Promise<T> {
  const client = new SologenicApiClient(config);
  return await callback(client);
}
