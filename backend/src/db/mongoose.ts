import mongoose from "mongoose";
import { config } from "../config";
import { logger } from "../utils/logger";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function connectMongo(retriesLeft = MAX_RETRIES): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info({ mongoUri: redact(config.mongoUri) }, "Connected to MongoDB");
  } catch (err) {
    logger.error({ err, retriesLeft }, "MongoDB connection failed");
    if (retriesLeft <= 0) {
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectMongo(retriesLeft - 1);
  }
}

mongoose.connection.on("error", (err) => {
  logger.error({ err }, "MongoDB connection error");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

function redact(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
}
