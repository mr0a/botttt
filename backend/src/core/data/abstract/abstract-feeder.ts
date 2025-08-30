import { Readable } from "stream";

/**
 * Abstract base class for data feeders.
 * Implementations should provide functionality for connecting to a data source,
 * handling connection events, and streaming data.
 */
export abstract class AbstractFeeder extends Readable {
  constructor() {
    super({ objectMode: true });
    if (new.target === AbstractFeeder) {
      throw new Error(
        "AbstractFeeder is an abstract class and cannot be instantiated directly.",
      );
    }
  }

  /**
   * Establishes a connection to the data source.
   */
  abstract connect(): Promise<void>;

  /**
   * Determines if a reconnection is necessary.
   */
  abstract shouldReconnect(): boolean;

  /**
   * Handles incoming messages from the WebSocket connection.
   */
  abstract onMessage(data: unknown): void;

  /**
   * Handles the closing of the WebSocket connection.
   */
  abstract onClose(code: number, reason: string): void;

  /**
   * Handles errors from the WebSocket connection.
   */
  abstract onError(error: Error): void;

  /**
   * Disconnects from the data source.
   */
  abstract disconnect(): Promise<void>;

  /**
   * Implementation of the Readable stream's _read method.
   */
  override _read() {
    // No-op for now - data is pushed via onMessage
  }

  /**
   * Push data to the readable stream
   */
  protected pushData(data: unknown): boolean {
    return this.push(data);
  }
}
