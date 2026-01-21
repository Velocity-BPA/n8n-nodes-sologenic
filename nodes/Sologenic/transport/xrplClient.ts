/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';
import type {
  AccountInfoResponse,
  AccountLinesResponse,
  AccountTxResponse,
  AccountOffersResponse,
  BookOffersResponse,
  TxResponse,
} from 'xrpl';
import { getXrplWsUrl } from '../constants/networks';

export interface XrplClientConfig {
  network: string;
  customWsUrl?: string;
}

export interface CurrencyAmount {
  currency: string;
  issuer?: string;
}

export class XrplClientWrapper {
  private client: Client;
  private wallet?: Wallet;

  constructor(wsUrl: string) {
    this.client = new Client(wsUrl);
  }

  async connect(): Promise<void> {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isConnected()) {
      await this.client.disconnect();
    }
  }

  setWallet(seed: string): void {
    this.wallet = Wallet.fromSeed(seed);
  }

  getWalletAddress(): string | undefined {
    return this.wallet?.address;
  }

  async getAccountInfo(address: string): Promise<AccountInfoResponse['result']> {
    await this.connect();
    const response = await this.client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated',
    });
    return response.result;
  }

  async getAccountBalance(address: string): Promise<{ xrp: string; drops: string }> {
    const info = await this.getAccountInfo(address);
    const drops = String(info.account_data.Balance);
    return {
      xrp: String(dropsToXrp(drops)),
      drops,
    };
  }

  async getAccountTrustlines(address: string, limit = 200): Promise<AccountLinesResponse['result']> {
    await this.connect();
    const response = await this.client.request({
      command: 'account_lines',
      account: address,
      ledger_index: 'validated',
      limit,
    });
    return response.result;
  }

  async getAccountTransactions(
    address: string,
    limit = 20,
    marker?: unknown,
  ): Promise<AccountTxResponse['result']> {
    await this.connect();
    const response = await this.client.request({
      command: 'account_tx',
      account: address,
      ledger_index_min: -1,
      ledger_index_max: -1,
      limit,
      marker,
    });
    return response.result;
  }

  async getAccountOffers(address: string, limit = 200): Promise<AccountOffersResponse['result']> {
    await this.connect();
    const response = await this.client.request({
      command: 'account_offers',
      account: address,
      ledger_index: 'validated',
      limit,
    });
    return response.result;
  }

  async getOrderBook(
    base: CurrencyAmount,
    quote: CurrencyAmount,
    limit = 20,
  ): Promise<{ bids: BookOffersResponse['result']['offers']; asks: BookOffersResponse['result']['offers'] }> {
    await this.connect();

    const takerGets = base.currency === 'XRP' ? { currency: 'XRP' } : { currency: base.currency, issuer: base.issuer! };
    const takerPays = quote.currency === 'XRP' ? { currency: 'XRP' } : { currency: quote.currency, issuer: quote.issuer! };

    const [bidsResponse, asksResponse] = await Promise.all([
      this.client.request({
        command: 'book_offers',
        taker_gets: takerGets,
        taker_pays: takerPays,
        limit,
      }),
      this.client.request({
        command: 'book_offers',
        taker_gets: takerPays,
        taker_pays: takerGets,
        limit,
      }),
    ]);

    return {
      bids: bidsResponse.result.offers,
      asks: asksResponse.result.offers,
    };
  }

  async submitTransaction(txBlob: string): Promise<TxResponse['result']> {
    await this.connect();
    const response = await this.client.request({
      command: 'submit',
      tx_blob: txBlob,
    });
    return response.result as unknown as TxResponse['result'];
  }

  async getServerInfo(): Promise<unknown> {
    await this.connect();
    const response = await this.client.request({ command: 'server_info' });
    return response.result;
  }

  static xrpToDrops(xrp: string | number): string {
    return String(xrpToDrops(xrp));
  }

  static dropsToXrp(drops: string | number): string {
    return String(dropsToXrp(drops));
  }

  static isValidAddress(address: string): boolean {
    return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
  }

  static fromCredentials(credentials: {
    network: string;
    customWsUrl?: string;
  }): XrplClientWrapper {
    const wsUrl = getXrplWsUrl(credentials.network, credentials.customWsUrl);
    return new XrplClientWrapper(wsUrl);
  }

  async getXrpBalance(address: string): Promise<string> {
    const balance = await this.getAccountBalance(address);
    return balance.xrp;
  }

  async getBalances(address: string): Promise<Array<{ currency: string; value: string; issuer?: string }>> {
    const trustlines = await this.getAccountTrustlines(address);
    return trustlines.lines.map((line) => ({
      currency: line.currency,
      value: line.balance,
      issuer: line.account,
    }));
  }

  async getTransactions(address: string, limit = 20): Promise<unknown[]> {
    const result = await this.getAccountTransactions(address, limit);
    return result.transactions;
  }
}

// Alias for compatibility
export { XrplClientWrapper as XrplClient };

export async function withXrplClient<T>(
  config: XrplClientConfig,
  callback: (client: XrplClientWrapper) => Promise<T>,
): Promise<T> {
  const wsUrl = getXrplWsUrl(config.network, config.customWsUrl);
  const client = new XrplClientWrapper(wsUrl);

  try {
    await client.connect();
    return await callback(client);
  } finally {
    await client.disconnect();
  }
}
