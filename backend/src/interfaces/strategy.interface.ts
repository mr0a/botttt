export type IStrategy = {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export interface IStrategyManager {
  loadStrategies(): void;
  getStrategyByName(name: string): IStrategy | undefined;
  getAllStrategies(): IStrategy[];
}
