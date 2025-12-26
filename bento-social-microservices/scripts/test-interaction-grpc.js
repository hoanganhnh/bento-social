#!/usr/bin/env node

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(
  __dirname,
  "../packages/shared/src/proto/interaction.proto",
);
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const interactionProto =
  grpc.loadPackageDefinition(packageDefinition).interaction;
const client = new interactionProto.InteractionService(
  "localhost:50054",
  grpc.credentials.createInsecure(),
);

console.log("🔌 Testing Interaction Service gRPC...\n");

console.log("Test 1: HasLiked");
client.HasLiked({ userId: "user-1", postId: "post-1" }, (error, response) => {
  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    console.log("✅ Response:", JSON.stringify(response, null, 2));
  }

  console.log("\nTest 2: ListPostIdsLiked");
  client.ListPostIdsLiked(
    { userId: "user-1", postIds: ["post-1", "post-2"] },
    (error, response) => {
      if (error) {
        console.error("❌ Error:", error.message);
      } else {
        console.log("✅ Response:", JSON.stringify(response, null, 2));
      }

      console.log("\nTest 3: HasSaved");
      client.HasSaved(
        { userId: "user-1", postId: "post-1" },
        (error, response) => {
          if (error) {
            console.error("❌ Error:", error.message);
          } else {
            console.log("✅ Response:", JSON.stringify(response, null, 2));
          }

          console.log("\nTest 4: ListPostIdsSaved");
          client.ListPostIdsSaved(
            { userId: "user-1", postIds: ["post-1", "post-2"] },
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
        },
      );
    },
  );
});
