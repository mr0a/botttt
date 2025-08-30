import { EventEmitter } from "events";
import { FlattradeFeeder } from "./flattrade-feeder";
import type { FlattradeWebSocketMessage } from "./types";
import { inject } from "inversify";
import type { IBrokerService } from "@src/interfaces/broker.interface";

type ModeType = "ltp" | "full";

interface SubscribeMessage {
  t: string;
  k: string;
}

interface UnsubscribeMessage {
  t: string;
  k: string;
}

export class FlattradeDataStreamer extends EventEmitter {
  private static readonly Mode = {
    LTP: "ltp" as const,
    FULL: "full" as const,
  };

  private static readonly FlattradeWsUrl =
    "wss://piconnect.flattrade.in/PiConnectWSTp/";

  private feeder: FlattradeFeeder | null = null;
  private subscriptions: Record<ModeType, Set<string>>;

  constructor(@inject("Flattrade") private brokerInstance: IBrokerService) {
    super();

    this.subscriptions = {
      [FlattradeDataStreamer.Mode.LTP]: new Set<string>(),
      [FlattradeDataStreamer.Mode.FULL]: new Set<string>(),
    };
  }

  async connect(): Promise<void> {
    this.feeder = new FlattradeFeeder(FlattradeDataStreamer.FlattradeWsUrl);
    this.setupEventListeners();
    this.subscriptionEventListeners();
    await this.feeder.connect();
  }

  async authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.feeder) {
        this.feeder.once("open", () => {
          this.feeder?.sendMessage(
            JSON.stringify({
              t: "c",
              uid: this.brokerInstance.userId,
              actid: this.brokerInstance.userId,
              source: "API",
              susertoken: this.brokerInstance.apiKey,
            }),
          );
        });
        this.feeder.once("data", (data: FlattradeWebSocketMessage) => {
          // Handle authentication response
          if (data.t === "ck") {
            resolve();
          }
        });
        setTimeout(() => {
          reject(new Error("Authentication timed out"));
        }, 5000);
      }
    });
  }

  disconnect(): void {
    if (this.feeder) {
      void this.feeder.disconnect();
      this.clearSubscriptions();
    }
  }

  subscribe(instrumentKeys: string[], mode: ModeType): void {
    if (!this.isValidMode(mode)) {
      return;
    }

    if (this.feeder) {
      // For Flattrade, we'll use the underlying feeder to subscribe
      // The actual subscription happens via WebSocket messages
      instrumentKeys.forEach((key) => {
        const subscribeMessage: SubscribeMessage = {
          t: "t",
          k: key,
        };
        this.feeder?.sendMessage(JSON.stringify(subscribeMessage));
      });
    }

    // Update local subscriptions
    const currentSet = this.subscriptions[mode];
    this.subscriptions[mode] = new Set<string>([
      ...currentSet,
      ...instrumentKeys,
    ]);
  }

  unsubscribe(instrumentKeys: string[]): void {
    if (this.feeder) {
      // Send unsubscribe messages
      instrumentKeys.forEach((key) => {
        const unsubscribeMessage: UnsubscribeMessage = {
          t: "u",
          k: key,
        };
        this.feeder?.sendMessage(JSON.stringify(unsubscribeMessage));
      });
    }

    // Update local subscriptions
    Object.values(this.subscriptions).forEach((set) => {
      instrumentKeys.forEach((key) => set.delete(key));
    });
  }

  changeMode(instrumentKeys: string[], newMode: ModeType): void {
    if (!this.isValidMode(newMode)) {
      return;
    }

    // Unsubscribe from current mode
    if (this.feeder) {
      instrumentKeys.forEach((key) => {
        const unsubscribeMessage: UnsubscribeMessage = {
          t: "u",
          k: key,
        };
        this.feeder?.sendMessage(JSON.stringify(unsubscribeMessage));
      });
    }

    // Clear keys from all modes
    Object.keys(this.subscriptions).forEach((mode) => {
      instrumentKeys.forEach((key) => {
        this.subscriptions[mode as ModeType].delete(key);
      });
    });

    // Add keys to the new mode
    const currentSet = this.subscriptions[newMode];
    this.subscriptions[newMode] = new Set<string>([
      ...currentSet,
      ...instrumentKeys,
    ]);

    // Subscribe to new mode
    if (this.feeder) {
      instrumentKeys.forEach((key) => {
        const subscribeMessage: SubscribeMessage = {
          t: "t",
          k: key,
        };
        this.feeder?.sendMessage(JSON.stringify(subscribeMessage));
      });
    }
  }

  private setupEventListeners(): void {
    if (!this.feeder) return;

    this.feeder.on("message", (data: FlattradeWebSocketMessage) => {
      this.emit("message", data);
    });

    this.feeder.on("error", (error: Error) => {
      this.emit("error", error);
    });

    this.feeder.on("close", () => {
      this.emit("close");
    });

    this.feeder.on("open", () => {
      this.emit("open");
    });
  }

  private subscriptionEventListeners(): void {
    if (!this.feeder) return;

    this.feeder.on("message", (data: FlattradeWebSocketMessage) => {
      // Handle subscription confirmations or errors
      if (data.t === "ck" || data.t === "uc") {
        this.emit("subscriptionStatus", data);
      }
    });
  }

  private clearSubscriptions(): void {
    this.subscriptions.ltp.clear();
    this.subscriptions.full.clear();
  }

  private isValidMode(mode: string): mode is ModeType {
    const validModes: ModeType[] = ["ltp", "full"];
    if (!validModes.includes(mode as ModeType)) {
      this.emit("error", new Error(`Invalid mode provided: ${mode}`));
      return false;
    }
    return true;
  }

  getCurrentSubscriptions(): Record<ModeType, string[]> {
    return {
      ltp: Array.from(this.subscriptions.ltp),
      full: Array.from(this.subscriptions.full),
    };
  }

  isConnected(): boolean {
    return this.feeder?.getIsConnected() ?? false;
  }
}
