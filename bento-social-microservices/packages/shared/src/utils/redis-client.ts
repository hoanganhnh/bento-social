import { Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { AppEvent, EventHandler } from '../events/app-event';
import { IEventBus } from '../interfaces/event-publisher.interface';

export class RedisClient implements IEventBus {
  private static instance: RedisClient;
  private redisClient: RedisClientType;
  private subscriberMap: Record<string, RedisClientType[]> = {};

  private constructor(connectionUrl: string) {
    this.redisClient = createClient({ url: connectionUrl });
  }

  public static async init(connectionUrl: string): Promise<void> {
    if (!this.instance) {
      this.instance = new RedisClient(connectionUrl);
      await this.instance.connect();
    }
  }

  public static getInstance(): RedisClient {
    if (!this.instance) {
      throw new Error('RedisClient instance not initialized. Call init() first.');
    }
    return this.instance;
  }

  public static isInitialized(): boolean {
    return !!this.instance;
  }

  private async connect(): Promise<void> {
    try {
      await this.redisClient.connect();
      Logger.log('Connected to Redis server', 'RedisClient');
    } catch (error) {
      Logger.error(`Failed to connect to Redis: ${(error as Error).message}`, 'RedisClient');
      throw error;
    }
  }

  public async publish<T>(event: AppEvent<T>): Promise<void> {
    try {
      await this.redisClient.publish(event.eventName, JSON.stringify(event.plainObject()));
      Logger.debug(`Published event: ${event.eventName}`, 'RedisClient');
    } catch (error) {
      Logger.error(`Failed to publish event: ${(error as Error).message}`, 'RedisClient');
    }
  }

  public async subscribe(topic: string, handler: EventHandler): Promise<void> {
    try {
      const subscriber = this.redisClient.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(topic, handler);

      const subs = this.subscriberMap[topic] || [];
      this.subscriberMap[topic] = [...subs, subscriber];
      
      Logger.log(`Subscribed to topic: ${topic}`, 'RedisClient');
    } catch (error) {
      Logger.error(`Failed to subscribe to topic ${topic}: ${(error as Error).message}`, 'RedisClient');
    }
  }

  public async unsubscribe(topic: string): Promise<void> {
    const subscribers = this.subscriberMap[topic];
    if (subscribers) {
      for (const sub of subscribers) {
        await sub.unsubscribe(topic);
        await sub.disconnect();
      }
      delete this.subscriberMap[topic];
    }
  }

  public async disconnect(): Promise<void> {
    // Disconnect all subscribers
    for (const topic of Object.keys(this.subscriberMap)) {
      await this.unsubscribe(topic);
    }

    // Disconnect main client
    await this.redisClient.disconnect();
    Logger.log('Disconnected from Redis server', 'RedisClient');
  }

  public getClient(): RedisClientType {
    return this.redisClient;
  }
}

