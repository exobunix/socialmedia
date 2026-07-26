import mongoose from "mongoose";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or MONGODB_URI environment variable is required but was not provided.",
  );
}

// Mongoose connects globally and buffers commands
mongoose.connect(databaseUrl).catch((err) => {
  console.error("Mongoose connection error:", err);
});

export const db = mongoose;

export * from "./schema";
