import pino from "pino";
import rotatingLogStream from "./rotate-transport";
import * as path from "path";
import { OpenobserveTransport } from "@openobserve/pino-openobserve";

const loggerOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "debug",
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {},
};

const logDirectory = path.resolve(process.env.LOG_PATH ?? "./logs");

const consoleTransportOptions = {
  target: "pino-pretty",
  options: {
    colorize: true, // Enable colors in the console
    translateTime: "dd/mm/yyyy HH:MM:ss", // Format timestamps
    ignore: "pid,hostname", // Remove unnecessary fields from the output
    hideObject: true, // Hide object details in the console output
  },
};

// Create a transport for pretty console logging
const prettyConsoleTransport = pino.transport(
  consoleTransportOptions,
) as NodeJS.WritableStream;

// Create a rotating log stream for debug logs
const debugLogStream = rotatingLogStream({
  filename: `${logDirectory}/%DATE%-debug`,
  frequency: "daily",
}) as NodeJS.WritableStream;

// Create a rotating log stream for error logs
const errorLogStream = rotatingLogStream({
  filename: `${logDirectory}/%DATE%-error`,
  frequency: "daily",
}) as NodeJS.WritableStream;

const openObserveTransport = new OpenobserveTransport({
  url: process.env.OPENOBSERVE_URL ?? "http://localhost:5080",
  auth: {
    username: process.env.OPENOBSERVE_USERNAME ?? "root@example.com",
    password: process.env.OPENOBSERVE_PASSWORD ?? "2CoxuydK5f1qwQsw",
  },
  streamName: process.env.OPENOBSERVE_STREAM_NAME ?? "trade-bot-logs",
  organization: process.env.OPENOBSERVE_ORGANIZATION ?? "default",
  batchSize: 50,
  timeThreshold: 5000,
  silentSuccess: true,
});

const pinoLogger = pino(
  loggerOptions,
  pino.multistream([
    {
      stream: debugLogStream,
      level: "debug",
    }, // Rotating debug log stream
    { stream: errorLogStream, level: "error" }, // Rotating error log stream
    { stream: prettyConsoleTransport, level: process.env.LOG_LEVEL ?? "debug" }, // Pretty console output
    { stream: openObserveTransport, level: "debug" }, // OpenObserve transport
  ]),
);

export default pinoLogger;
export { logDirectory };
