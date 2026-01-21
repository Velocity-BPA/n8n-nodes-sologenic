/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface WebSocketConfig {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface SubscriptionMessage {
  type: 'subscribe' | 'unsubscribe';
  channel: string;
  params?: Record<string, unknown>;
}

export interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: unknown;
  error?: string;
}

export class SologenicWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private subscriptions: Map<string, SubscriptionMessage> = new Map();
  private isConnected = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.on('open', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startPing();
          this.resubscribe();
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString()) as WebSocketMessage;
            this.handleMessage(message);
          } catch {
            this.emit('error', new Error('Failed to parse message'));
          }
        });

        this.ws.on('close', () => {
          this.isConnected = false;
          this.stopPing();
          this.emit('disconnected');
          this.handleReconnect();
        });

        this.ws.on('error', (error: Error) => {
          this.emit('error', error);
          if (!this.isConnected) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        this.ws.ping();
      }
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    if (message.error) {
      this.emit('error', new Error(message.error));
      return;
    }

    switch (message.type) {
      case 'price':
        this.emit('price', message.data);
        break;
      case 'orderbook':
        this.emit('orderbook', message.data);
        break;
      case 'trade':
        this.emit('trade', message.data);
        break;
      case 'balance':
        this.emit('balance', message.data);
        break;
      case 'order':
        this.emit('order', message.data);
        break;
      case 'transaction':
        this.emit('transaction', message.data);
        break;
      default:
        this.emit('message', message);
    }

    if (message.channel) {
      this.emit(`channel:${message.channel}`, message.data);
    }
  }

  private handleReconnect(): void {
    if (!this.config.reconnect) return;
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect().catch((error) => {
        this.emit('error', error);
      });
    }, this.config.reconnectInterval);
  }

  private resubscribe(): void {
    for (const subscription of this.subscriptions.values()) {
      this.send(subscription);
    }
  }

  private send(message: unknown): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(channel: string, params?: Record<string, unknown>): void {
    const message: SubscriptionMessage = {
      type: 'subscribe',
      channel,
      params,
    };
    this.subscriptions.set(channel, message);
    this.send(message);
  }

  unsubscribe(channel: string): void {
    const message: SubscriptionMessage = {
      type: 'unsubscribe',
      channel,
    };
    this.subscriptions.delete(channel);
    this.send(message);
  }

  subscribeToPrices(symbols: string[]): void {
    this.subscribe('prices', { symbols });
  }

  subscribeToOrderBook(symbol: string): void {
    this.subscribe(`orderbook:${symbol}`, { symbol });
  }

  subscribeToTrades(symbol: string): void {
    this.subscribe(`trades:${symbol}`, { symbol });
  }

  subscribeToBalance(address: string): void {
    this.subscribe(`balance:${address}`, { address });
  }

  subscribeToOrders(address: string): void {
    this.subscribe(`orders:${address}`, { address });
  }

  subscribeToTransactions(address: string): void {
    this.subscribe(`transactions:${address}`, { address });
  }

  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
  }

  getConnectionState(): boolean {
    return this.isConnected;
  }
}

export function createWebSocketClient(url: string): SologenicWebSocketClient {
  return new SologenicWebSocketClient({ url });
}
