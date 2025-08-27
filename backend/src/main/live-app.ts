import { injectable, inject } from "inversify";
import { Server } from "../services/server";
import { TYPES } from "../lib/container/types";
import type { ILogger } from "../lib/logger/types";

@injectable()
export class LiveApplication {
  private isRunning = false;
  private server: Server;

  constructor(
    @inject(TYPES.Server) server: Server,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {
    this.server = server;
  }

  initialise(mode: ApplicationMode): void {
    this.logger.info({ mode }, "Initialising application...");
    this.logger.info("Application initialised successfully");
  }

  start(): void {
    if (this.isRunning) {
      this.logger.warn("Application is already running");
      return;
    }

    try {
      this.logger.info("Starting application...");

      this.server.start();
      throw new Error("Application start method is not implemented yet");
      this.isRunning = true;
      this.logger.info("Application started successfully");
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
