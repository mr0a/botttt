/**
 * Abstract base class for WebSocket-based data streamers.
 * Provides auto-reconnection functionality and common event handling.
 */
import type { WebSocket } from "bun";
import { EventEmitter } from "events";

export abstract class AbstractDataStreamer extends EventEmitter {
  static Event = Object.freeze({
    OPEN: "open",
    CLOSE: "close",
    MESSAGE: "message",
    ERROR: "error",
    RECONNECTING: "reconnecting",
    AUTO_RECONNECT_STOPPED: "autoReconnectStopped",
  });

  #enableAutoReconnect = true;
  #interval = 1;
  #retryCount = 5;
  #reconnectInterval: NodeJS.Timeout | null = null;
  #reconnectOpenListener: (() => void) | null = null;
  #reconnectCloseListener: (() => void) | null = null;

  protected ws: WebSocket | null = null;
  protected isConnected = false;

  constructor() {
    super();
    this.#prepareAutoReconnect();

    if (new.target === AbstractDataStreamer) {
      throw new TypeError(
        "Cannot construct AbstractDataStreamer instances directly",
      );
    }
  }

  /**
   * Abstract method to establish WebSocket connection
   */
  abstract connect(): Promise<void>;

  /**
   * Abstract method to close WebSocket connection
   */
  abstract disconnect(): Promise<void>;

  /**
   * Abstract method to add broker-specific event listeners
   */
  abstract addEventsListeners(): void;

  /**
   * Setup common WebSocket event listeners
   */
  protected setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.addEventListener("open", () => {
      this.isConnected = true;
      this.emit(AbstractDataStreamer.Event.OPEN);
    });

    this.ws.addEventListener("message", (event) => {
      this.emit(
        AbstractDataStreamer.Event.MESSAGE,
        (event as MessageEvent).data,
      );
    });

    this.ws.addEventListener("error", (event) => {
      this.emit(
        AbstractDataStreamer.Event.ERROR,
        (event as ErrorEvent).error ?? new Error("WebSocket error"),
      );
    });

    this.ws.addEventListener("close", (event) => {
      this.isConnected = false;
      const closeEvent = event;
      this.emit(
        AbstractDataStreamer.Event.CLOSE,
        closeEvent.code,
        Buffer.from(closeEvent.reason),
      );
    });
  }

  /**
   * Prepare auto-reconnection mechanism
   */
  #prepareAutoReconnect(): void {
    let counter = 0;

    const attemptReconnect = () => {
      if (!this.#enableAutoReconnect) {
        if (this.#reconnectInterval) {
          clearInterval(this.#reconnectInterval);
          this.#reconnectInterval = null;
        }
        return;
      }

      if (!this.isConnected) {
        this.emit(
          AbstractDataStreamer.Event.RECONNECTING,
          `Auto reconnect attempt ${counter + 1}/${this.#retryCount}`,
        );

        this.connect()
          .then(() => {
            counter++;
          })
          .catch(() => {
            // Connection failed, will retry
          });
      }

      if (counter >= this.#retryCount) {
        if (this.#reconnectInterval) {
          clearInterval(this.#reconnectInterval);
          this.#reconnectInterval = null;
        }
        this.emit(
          AbstractDataStreamer.Event.AUTO_RECONNECT_STOPPED,
          `retryCount of ${this.#retryCount} exhausted.`,
        );
        return;
      }
    };

    // Remove existing listeners if they exist
    if (this.#reconnectOpenListener) {
      this.removeListener(
        AbstractDataStreamer.Event.OPEN,
        this.#reconnectOpenListener,
      );
    }
    if (this.#reconnectCloseListener) {
      this.removeListener(
        AbstractDataStreamer.Event.CLOSE,
        this.#reconnectCloseListener,
      );
    }

    // Define new listeners
    this.#reconnectOpenListener = () => {
      if (this.#reconnectInterval) {
        clearInterval(this.#reconnectInterval);
        this.#reconnectInterval = null;
      }
      counter = 0;
    };

    this.#reconnectCloseListener = () => {
      if (this.#enableAutoReconnect) {
        this.#reconnectInterval = setInterval(
          attemptReconnect,
          this.#interval * 1000,
        );
      }
    };

    // Attach the new listeners
    this.on(AbstractDataStreamer.Event.OPEN, this.#reconnectOpenListener);
    this.on(AbstractDataStreamer.Event.CLOSE, this.#reconnectCloseListener);
  }

  /**
   * Configure auto-reconnection settings
   */
  autoReconnect(enable: boolean, interval = 1, retryCount = 5): void {
    this.#enableAutoReconnect = enable;
    this.#interval = interval;
    this.#retryCount = retryCount;

    if (!enable) {
      if (this.#reconnectInterval) {
        clearInterval(this.#reconnectInterval);
        this.#reconnectInterval = null;
      }
      this.emit(
        AbstractDataStreamer.Event.AUTO_RECONNECT_STOPPED,
        "Stopped by client.",
      );
      return;
    }

    this.#prepareAutoReconnect();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Check if WebSocket should reconnect
   */
  shouldReconnect(): boolean {
    return !this.isConnected && this.#enableAutoReconnect;
  }

  /**
   * Clear subscriptions (to be implemented by subclasses)
   */
  clearSubscriptions(): void {
    // Override in subclasses if needed
  }
}
