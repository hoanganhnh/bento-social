#!/usr/bin/env node

const amqp = require("amqplib");

async function testRabbitMQEvent() {
  try {
    console.log("🔌 Connecting to RabbitMQ...");
    const connection = await amqp.connect(
      "amqp://bento:bento_rabbit@localhost:5672",
    );
    const channel = await connection.createChannel();

    // Declare exchange
    await channel.assertExchange("bento.events", "topic", { durable: true });

    // Create test event
    const event = {
      id: "test-event-123",
      occurredAt: new Date().toISOString(),
      senderId: "test-user-1",
      eventName: "PostCreated",
      payload: {
        postId: "test-post-123",
        topicId: "test-topic-456",
      },
    };

    // Publish event
    console.log("📤 Publishing PostCreated event...");
    channel.publish(
      "bento.events",
      "PostCreated",
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: "application/json",
        timestamp: Date.now(),
      },
    );

    console.log("✅ Event published successfully!");
    console.log("Event:", JSON.stringify(event, null, 2));

    // Wait a bit then close
    setTimeout(async () => {
      await channel.close();
      await connection.close();
      console.log(
        "\n✨ Test completed! Check Topic Service logs for event processing.",
      );
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testRabbitMQEvent();
