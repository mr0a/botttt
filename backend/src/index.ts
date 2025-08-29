import "reflect-metadata";
import { BacktestApplication, LiveApplication } from "./main";
import { ContainerSetup } from "@src/lib/container/container";
import { logger } from "@src/lib/logger";
import type { AppConfig, ApplicationMode } from "./types/main/application";

export class AppBootstrap {
  static async start(): Promise<void> {
    const config = this.getConfig();

    switch (config.mode) {
      case "LIVE":
      case "PAPER": {
        const container = ContainerSetup.createContainer(config.mode);
        const liveApp = container.get<LiveApplication>("LiveApplication");
        liveApp.initialise(config.mode);
        break;
      }

      case "BACKTEST": {
        const backtestApp = new BacktestApplication();
        await backtestApp.initialize(config.accountId);
        break;
      }

      default:
        throw new Error(`Unknown application mode: ${config.mode as string}`);
    }
  }

  private static getConfig(): AppConfig {
    return {
      mode: (process.env.APP_MODE as ApplicationMode) || "PAPER",
      accountId: process.env.ACCOUNT_ID ?? "PAPER",
    };
  }
}

AppBootstrap.start().catch((error: unknown) => {
  logger.error(error, "Error starting application");
});

process.addListener("unhandledRejection", (error) => {
  logger.error(error, "Unhandled promise rejection");
});

process.addListener("uncaughtException", (error) => {
  logger.error(error, "Uncaught exception");
});
