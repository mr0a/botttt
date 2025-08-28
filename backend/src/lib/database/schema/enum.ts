import { pgEnum } from "drizzle-orm/pg-core/columns/enum";

// Enum values
export const InstrumentType = ["STOCK", "INDEX", "FUTURE", "OPTION"] as const;

export const ExchangeType = ["NSE", "BSE"] as const;

export const TransactionType = ["BUY", "SELL"] as const;

export const OptionType = ["CALL", "PUT"] as const;

export const OrderStatus = [
  "PENDING",
  "FILLED",
  "CANCELLED",
  "REJECTED",
  "PARTIAL",
] as const;

export const PositionStatus = ["OPEN", "CLOSED"] as const;

export const ExecutionMode = ["PAPER", "LIVE"] as const;

// Pg enums
export const instrumentTypeEnum = pgEnum("instrument_type", InstrumentType);
export const exchangeEnum = pgEnum("exchange", ExchangeType);
export const transactionTypeEnum = pgEnum("transaction_type", TransactionType);
export const optionTypeEnum = pgEnum("option_type", OptionType);
export const orderStatusEnum = pgEnum("order_status", OrderStatus);
export const positionStatusEnum = pgEnum("position_status", PositionStatus);
export const executionModeEnum = pgEnum("execution_mode", ExecutionMode);

// Extract type from the enum
export type InstrumentType = (typeof instrumentTypeEnum.enumValues)[number];
export type ExchangeType = (typeof exchangeEnum.enumValues)[number];
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];
export type OptionType = (typeof optionTypeEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PositionStatus = (typeof positionStatusEnum.enumValues)[number];
export type ExecutionMode = (typeof executionModeEnum.enumValues)[number];
