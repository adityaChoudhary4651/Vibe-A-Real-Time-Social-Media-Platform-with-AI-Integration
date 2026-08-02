import mongoose from "mongoose";
import { env } from "../config/env.js";

beforeAll(async () => {
  // Override database to vibe_test to isolate test executions
  await mongoose.connect(env.MONGO_URI, {
    dbName: "vibe_test"
  });
});

afterEach(async () => {
  // Clear all database collections between test runs to prevent test state cross-contamination
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  // Disconnect cleanly on suite completion to allow vitest to exit
  await mongoose.disconnect();
});
