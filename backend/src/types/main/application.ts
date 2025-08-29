export type ApplicationMode = "LIVE" | "PAPER" | "BACKTEST";

export interface AppConfig {
  mode: ApplicationMode;
  accountId: string;
}
