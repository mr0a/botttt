"use strict";

import { getStream } from "file-stream-rotator/lib/index";
import type { FileStreamRotatorOptions } from "file-stream-rotator/lib/types";
import type { Writable } from "stream";

const defaultOptions: Partial<FileStreamRotatorOptions> = {
  filename: `${process.env.LOG_PATH ?? "./logs"}/app-%DATE%`,
  frequency: "daily",
  date_format: "YYYY-MM-DD",
  verbose: process.env.NODE_ENV !== "production",
  size: "10m", // Rotate after 10MB
  max_logs: "30d", // Keep logs for 30 days
  audit_file: `${process.env.LOG_PATH ?? "./logs"}/audit.json`,
  extension: ".log",
  file_options: {
    flags: "a",
    encoding: "utf8",
  },
};

// Create and export the rotating log stream instance
// const rotatingLogStream = getStream(options) as unknown as Writable;

export default function getRotatingLogStream(
  options: Partial<FileStreamRotatorOptions> = {},
): Writable {
  return getStream({ ...defaultOptions, ...options }) as unknown as Writable;
}
