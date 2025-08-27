import type {
  IStrategy,
  IStrategyManager,
} from "@src/interfaces/strategy.interface";
import { injectable } from "inversify";

@injectable()
export class StrategyManager implements IStrategyManager {
  getStrategyByName(_name: string): IStrategy | undefined {
    throw new Error("Method not implemented.");
  }
  getAllStrategies(): IStrategy[] {
    throw new Error("Method not implemented.");
  }

  loadStrategies(): void {
    // Load all strategies
  }
}
