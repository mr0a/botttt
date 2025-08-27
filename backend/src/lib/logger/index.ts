import Logger from "./base";
import tradeLogger from "./trade-logger";

const logger = {
  debug: Logger.debug.bind(Logger),
  info: Logger.info.bind(Logger),
  warn: Logger.warn.bind(Logger),
  error: Logger.error.bind(Logger),
};

export { logger, tradeLogger };

// Export types
export type { ILogger } from "./types";
