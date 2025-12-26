#!/usr/bin/env node

/**
 * gRPC Client Test for User Service
 * Tests FindById and FindByIds methods
 */

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Load proto file
const PROTO_PATH = path.join(
  __dirname,
  "../packages/shared/src/proto/user.proto",
);
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Create client
const client = new userProto.UserService(
  "localhost:50051",
  grpc.credentials.createInsecure(),
);

console.log("🔌 Testing User Service gRPC...\n");

// Test 1: FindById
console.log("Test 1: FindById");
client.FindById({ id: "test-user-id" }, (error, response) => {
  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    console.log("✅ Response:", JSON.stringify(response, null, 2));
  }

  // Test 2: FindByIds
  console.log("\nTest 2: FindByIds");
  client.FindByIds(
    { ids: ["user-1", "user-2", "user-3"] },
    (error, response) => {
      if (error) {
        console.error("❌ Error:", error.message);
      } else {
        console.log("✅ Response:", JSON.stringify(response, null, 2));
      }

      console.log("\n✨ Tests completed!");
      process.exit(0);
    },
  );
});
