import type { IBrokerService } from "./broker.interface";
import type { IStrategy } from "./strategy.interface";

export interface IBacktestResult {
  // Define the structure of your backtest result here
  success: boolean;
  data: object; // Replace with your actual data structure
}

export interface IBacktestEngine {
  initialize(broker: IBrokerService): Promise<void>;
  runBacktest(strategy: IStrategy): Promise<IBacktestResult>;
}
