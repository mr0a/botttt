type ApplicationMode = "LIVE" | "PAPER" | "BACKTEST";

interface AppConfig {
  mode: ApplicationMode;
  accountId: string;
}
