export const TYPES = {
  Database: Symbol.for("Database"), // TODO: Avoid using this and try to remove this
  Logger: Symbol.for("Logger"),

  Server: Symbol.for("Server"),
  Application: Symbol.for("Application"),
} as const;
