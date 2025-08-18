import "reflect-metadata";
import { container } from "./lib/container";
import { TYPES } from "./lib/container/types";
import { Application } from "./lib/application";
import type { ILogger } from "./lib/logger";

// Get application instance from container
const app = container.get<Application>(TYPES.Application);
const logger = container.get<ILogger>(TYPES.Logger);

logger.info("Trade Bot starting...");

// Start the application
app.start();

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully");
  app.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully");
  app.stop();
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error, origin) => {
  // log uncaught exceptions and try to fix
  logger.error({ error, origin }, "Uncaught Exception");
  app.stop();
  // process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  // log unhandled rejections and try to fix
  logger.error({ reason, promise }, "Unhandled Rejection");
  app.stop();
  // process.exit(1);
});
