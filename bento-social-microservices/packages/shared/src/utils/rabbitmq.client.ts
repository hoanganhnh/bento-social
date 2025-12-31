import amqp, { ChannelWrapper } from "amqp-connection-manager";
import { Channel, ConsumeMessage } from "amqplib";
import { Logger } from "@nestjs/common";

import { AppEvent } from "../events/app-event";

export class RabbitMQClient {
  private static instance: RabbitMQClient;
  private connection: any;
  private publisherChannel: ChannelWrapper;
  private readonly logger = new Logger(RabbitMQClient.name);
  private isConnected = false;

  private constructor() {}

  static getInstance(): RabbitMQClient {
    if (!RabbitMQClient.instance) {
      RabbitMQClient.instance = new RabbitMQClient();
    }
    return RabbitMQClient.instance;
  }

  static isInitialized(): boolean {
    return RabbitMQClient.instance?.isConnected || false;
  }

  async connect(url: string): Promise<void> {
    try {
      this.connection = amqp.connect([url]);

      this.connection.on("connect", () => {
        this.logger.log("Connected to RabbitMQ");
        this.isConnected = true;
      });

      this.connection.on("disconnect", (err: any) => {
        this.logger.warn("Disconnected from RabbitMQ", err?.err?.message);
        this.isConnected = false;
      });

      this.connection.on("error", (err: any) => {
        this.logger.error("RabbitMQ connection error", err);
      });

      // Create publisher channel
      this.publisherChannel = this.connection.createChannel({
        json: true,
        setup: async (channel: Channel) => {
          // Declare exchanges
          await channel.assertExchange("bento.events", "topic", {
            durable: true,
          });
          await channel.assertExchange("bento.dlx", "topic", { durable: true });
        },
      });

      await this.publisherChannel.waitForConnect();
      this.logger.log("RabbitMQ publisher channel ready");
    } catch (error) {
      this.logger.error("Failed to connect to RabbitMQ", error);
      throw error;
    }
  }

  async publish(event: AppEvent<any>): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn("RabbitMQ not connected, skipping event publish");
      return;
    }

    try {
      const routingKey = event.eventName;
      const payload = event.plainObject();

      await this.publisherChannel.publish("bento.events", routingKey, payload, {
        persistent: true,
        contentType: "application/json",
        timestamp: Date.now(),
      });

      this.logger.debug(`Published event: ${event.eventName}`);
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.eventName}`, error);
      throw error;
    }
  }

  async subscribe<T extends AppEvent<any>>(
    eventType: string,
    handler: (event: T) => Promise<void>,
    queueName?: string,
  ): Promise<void> {
    const queue = queueName || `${eventType}.queue`;

    const consumerChannel = this.connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        // Assert queue with dead letter exchange
        await channel.assertQueue(queue, {
          durable: true,
          deadLetterExchange: "bento.dlx",
          deadLetterRoutingKey: `${eventType}.dlq`,
        });

        // Bind queue to exchange
        await channel.bindQueue(queue, "bento.events", eventType);

        // Set prefetch to 1 for fair dispatch
        await channel.prefetch(1);

        // Start consuming
        await channel.consume(queue, async (msg: ConsumeMessage | null) => {
          if (!msg) return;

          try {
            const event = JSON.parse(msg.content.toString()) as T;
            await handler(event);
            channel.ack(msg);
          } catch (error) {
            this.logger.error(`Error processing event ${eventType}:`, error);
            // Reject and requeue (will go to DLQ after max retries)
            channel.nack(msg, false, false);
          }
        });

        this.logger.log(`Subscribed to event: ${eventType} on queue: ${queue}`);
      },
    });

    await consumerChannel.waitForConnect();
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.isConnected = false;
      this.logger.log("RabbitMQ connection closed");
    }
  }
}
