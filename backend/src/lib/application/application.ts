import { injectable, inject } from "inversify";
import { Server } from "../server";
import { TYPES } from "../container/types";
import type { ILogger } from "../logger/types";

@injectable()
export class Application {
  private isRunning = false;
  private server: Server;

  constructor(
    @inject(TYPES.Server) server: Server,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {
    this.server = server;
  }

  start(): void {
    if (this.isRunning) {
      this.logger.warn("Application is already running");
      return;
    }

    try {
      this.logger.info("Starting application...");

      // Initialize logging
      this.logger.debug(
        {
          status: "starting",
          uptime: 0,
          timestamp: new Date().toISOString(),
        },
        "Application starting",
      );

      // Start the server
      this.server.start();

      this.isRunning = true;

      this.logger.info("Application started successfully");
      throw new Error("Application start method is not implemented yet");
    } catch (error) {
      this.logger.error(error, "Failed to start application");
      throw error;
    }
  }

  stop(): void {
    if (!this.isRunning) {
      this.logger.warn("Application is not running");
      return;
    }

    try {
      this.logger.info("Stopping application...");

      // Stop the server
      this.server.stop();

      this.isRunning = false;

      this.logger.info("Application stopped successfully");
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Failed to stop application",
      );
      throw error;
    }
  }

  restart(): void {
    this.logger.info("Restarting application...");

    try {
      this.stop();
      this.start();
      this.logger.info("Application restarted successfully");
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Failed to restart application",
      );
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isRunning;
  }
}
