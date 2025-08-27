import type { IBacktestEngine } from "../interfaces/backtest.interface";
import type { BrokerFactory } from "../lib/container/broker-factory";
import { ContainerSetup } from "../lib/container/container";

export class BacktestApplication {
  async initialize(accountId: string): Promise<void> {
    const container = ContainerSetup.createContainer("BACKTEST");

    // Backtesting uses historical data provider and paper trading broker
    const brokerFactory = container.get<BrokerFactory>("BrokerFactory");
    const broker = brokerFactory.createBroker(accountId, "BACKTEST");

    // Initialize backtesting engine
    const backtestEngine = container.get<IBacktestEngine>("BacktestEngine");
    await backtestEngine.initialize(broker);
  }
}
