import { injectable, inject, Container } from "inversify";
import type { IBrokerService } from "../../interfaces/broker.interface";
import { ConfigService } from "../config";

export interface BrokerFactory {
  createBroker(accountId: string, mode: ApplicationMode): IBrokerService;
}

@injectable()
export class BrokerFactoryImpl implements BrokerFactory {
  constructor(@inject("Container") private container: Container) {}

  createBroker(accountId: string, mode: ApplicationMode): IBrokerService {
    const config = this.getBrokerConfig(accountId);

    if (mode === "PAPER" || mode === "BACKTEST") {
      return this.container.get<IBrokerService>("PaperTradingBroker");
    }

    // Determine broker type based on account configuration
    switch (config.brokerType) {
      case "ZERODHA":
        return this.container.get<IBrokerService>("ZerodhaBroker");
      case "ALICE_BLUE":
        return this.container.get<IBrokerService>("AliceBlueBroker");
      default:
        throw new Error(`Unsupported broker type: ${config.brokerType}`);
    }
  }

  private getBrokerConfig(accountId: string): BrokerConfig {
    // Fetch broker configuration from database or config file
    const configService = new ConfigService();
    return configService.getBrokerConfig(accountId);
  }
}
