import Logger from "./base";

const TradeLogger = Logger.child({ module: "trade" }, { msgPrefix: "[TRADE]" });

const tradeLogger = {
  debug: TradeLogger.debug.bind(TradeLogger),
  info: TradeLogger.info.bind(TradeLogger),
  warn: TradeLogger.warn.bind(TradeLogger),
  error: TradeLogger.error.bind(TradeLogger),
};

export default tradeLogger;
