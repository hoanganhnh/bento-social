#!/usr/bin/env node

/**
 * gRPC Client Test for Auth Service
 * Tests IntrospectToken method
 */

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Load proto file
const PROTO_PATH = path.join(
  __dirname,
  "../packages/shared/src/proto/auth.proto",
);
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const authProto = grpc.loadPackageDefinition(packageDefinition).auth;

// Create client
const client = new authProto.AuthService(
  "localhost:50052",
  grpc.credentials.createInsecure(),
);

console.log("🔌 Testing Auth Service gRPC...\n");

// Test: IntrospectToken with invalid token
console.log("Test 1: IntrospectToken (invalid token)");
client.IntrospectToken({ token: "invalid-token-123" }, (error, response) => {
  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    console.log("✅ Response:", JSON.stringify(response, null, 2));
  }

  console.log("\n✨ Test completed!");
  process.exit(0);
});
