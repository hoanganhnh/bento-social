#!/usr/bin/env node

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(
  __dirname,
  "../packages/shared/src/proto/topic.proto",
);
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const topicProto = grpc.loadPackageDefinition(packageDefinition).topic;
const client = new topicProto.TopicService(
  "localhost:50053",
  grpc.credentials.createInsecure(),
);

console.log("🔌 Testing Topic Service gRPC...\n");

console.log("Test 1: FindById");
client.FindById({ id: "test-topic-id" }, (error, response) => {
  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    console.log("✅ Response:", JSON.stringify(response, null, 2));
  }

  console.log("\nTest 2: FindByIds");
  client.FindByIds({ ids: ["topic-1", "topic-2"] }, (error, response) => {
    if (error) {
      console.error("❌ Error:", error.message);
    } else {
      console.log("✅ Response:", JSON.stringify(response, null, 2));
    }

    console.log("\n✨ Tests completed!");
    process.exit(0);
  });
});
