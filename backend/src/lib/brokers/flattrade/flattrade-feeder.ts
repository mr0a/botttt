import { AbstractFeeder } from "../../../core/data/abstract/abstract-feeder";
import type { FlattradeWebSocketMessage } from "./types";

export class FlattradeFeeder extends AbstractFeeder {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private isConnected = false;
  private userClosedWebSocket = false;

  constructor(wsUrl: string) {
    super();
    this.wsUrl = wsUrl;
  }

  connect(): Promise<void> {
    // Skip if already connected
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      return Promise.resolve();
    }

    this.ws = new WebSocket(this.wsUrl);
    this.setupWebSocketEvents();
    return Promise.resolve();
  }

  shouldReconnect(): boolean {
    return (
      this.ws === null ||
      (!this.userClosedWebSocket && this.ws.readyState !== WebSocket.OPEN)
    );
  }

  onOpen(): void {
    if (!this.ws) return;

    this.ws.addEventListener("open", () => {
      this.isConnected = true;
      this.userClosedWebSocket = false;
      this.emit("open");
    });
  }

  onMessage(): void {
    if (!this.ws) return;

    this.ws.addEventListener("message", (event: MessageEvent) => {
      try {
        const message = JSON.parse(
          String(event.data),
        ) as FlattradeWebSocketMessage;

        this.pushData(message);
      } catch (error) {
        this.emit(
          "error",
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    });
  }

  onClose(): void {
    if (!this.ws) return;

    this.ws.addEventListener("close", (event: CloseEvent) => {
      this.isConnected = false;
      this.push(null); // Signal end of stream

      if (event.code === 1000) {
        this.userClosedWebSocket = true;
      }

      this.emit("close", event.code, event.reason);
    });
  }

  onError(): void {
    if (!this.ws) return;

    this.ws.addEventListener("error", (event: Event) => {
      const errorEvent = event as ErrorEvent;
      let error: Error;

      if (
        errorEvent.error &&
        typeof errorEvent.error === "object" &&
        errorEvent.error instanceof Error
      ) {
        error = errorEvent.error;
      } else {
        error = new Error("WebSocket error");
      }

      this.emit("error", error);
    });
  }

  disconnect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, "Normal closure");
    }
    this.ws = null;
    return Promise.resolve();
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  sendMessage(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.emit("error", new Error("WebSocket is not open"));
    }
  }

  private setupWebSocketEvents(): void {
    this.onOpen();
    this.onMessage();
    this.onClose();
    this.onError();
  }
}
