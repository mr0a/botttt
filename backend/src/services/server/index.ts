import { injectable, inject } from "inversify";
import { TYPES } from "@src/lib/container/types";
import type { ILogger } from "../../lib/logger";

@injectable()
export class Server {
  private server?: ReturnType<typeof Bun.serve>;

  constructor(@inject(TYPES.Logger) private logger: ILogger) {}

  start(): void {
    const port = parseInt(process.env.PORT ?? "3000", 10);

    this.server = Bun.serve({
      port,
      fetch: () => new Response("Trade Bot Server Running", { status: 200 }),
    });

    this.logger.info(`Server started on port ${port}`);
  }

  stop(): void {
    this.logger.info("Stopping server...");
    void this.server?.stop();
    this.logger.info("Server stopped");
  }
}
