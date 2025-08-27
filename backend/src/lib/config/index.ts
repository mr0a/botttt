import { logger } from "../logger";

export class ConfigService {
  getBrokerConfig(accountId: string): BrokerConfig {
    // Fetch broker configuration from database or config file
    logger.debug(`Fetching broker config for accountId: ${accountId}`);
    return {
      brokerType: "ZERODHA",
      apiKey: "your_api_key",
      apiSecret: "your_api_secret",
    };
  }
}
