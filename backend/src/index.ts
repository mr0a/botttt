import { formatTimestamp } from "./lib/utils";

// Main entry point for the trading bot application
console.log("Trade Bot starting...");

const server = Bun.serve({
  port: process.env.PORT ?? 3000,
  fetch(request) {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          timestamp: formatTimestamp(new Date()),
          uptime: process.uptime(),
          version: process.env.npm_package_version ?? "1.0.0",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Root endpoint
    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          message: "Trade Bot API",
          version: "1.0.0",
          status: "running",
          endpoints: {
            health: "/health",
            api: "/api/v1",
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({
        error: "Not Found",
        message: "The requested endpoint does not exist",
        path: url.pathname,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 404,
      },
    );
  },
});

console.log(`Trade Bot API running on http://localhost:${server.port}`);

export default server;
