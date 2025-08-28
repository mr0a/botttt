CREATE TYPE "public"."exchange" AS ENUM('NSE', 'BSE');--> statement-breakpoint
CREATE TYPE "public"."instrument_type" AS ENUM('STOCK', 'INDEX', 'FUTURE', 'OPTION');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('BUY', 'SELL');--> statement-breakpoint
CREATE TABLE "broker_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"broker_name" varchar(50) NOT NULL,
	"encrypted_api_key" varchar NOT NULL,
	"encrypted_secret" varchar NOT NULL,
	"encryption_key_id" varchar(50) NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "instrument" (
	"instrument_id" integer PRIMARY KEY NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"exchange" "exchange" NOT NULL,
	"instrument_type" "instrument_type" NOT NULL,
	"is_active" boolean DEFAULT true,
	"listing_date" date,
	"delisting_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "instrument_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "daily_ohlcv" (
	"date" date NOT NULL,
	"instrument_id" integer NOT NULL,
	"open_price" numeric(12, 4) NOT NULL,
	"high_price" numeric(12, 4) NOT NULL,
	"low_price" numeric(12, 4) NOT NULL,
	"close_price" numeric(12, 4) NOT NULL,
	"volume" bigint NOT NULL,
	"turnover" numeric(20, 2),
	"trades_count" integer,
	"delivery_quantity" bigint,
	"delivery_percentage" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "daily_ohlcv_date_instrument_id_pk" PRIMARY KEY("date","instrument_id")
);
--> statement-breakpoint
CREATE TABLE "ohlcv_candle" (
	"time" timestamp with time zone NOT NULL,
	"instrument_id" integer NOT NULL,
	"timeframe" varchar(10) NOT NULL,
	"open_price" numeric(12, 4) NOT NULL,
	"high_price" numeric(12, 4) NOT NULL,
	"low_price" numeric(12, 4) NOT NULL,
	"close_price" numeric(12, 4) NOT NULL,
	"volume" bigint NOT NULL,
	CONSTRAINT "ohlcv_candle_time_instrument_id_timeframe_pk" PRIMARY KEY("time","instrument_id","timeframe")
);
--> statement-breakpoint
CREATE TABLE "open_interest" (
	"time" timestamp with time zone NOT NULL,
	"instrument_id" integer NOT NULL,
	"open_interest" bigint NOT NULL,
	"change_in_oi" bigint,
	"percentage_change" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "open_interest_time_instrument_id_pk" PRIMARY KEY("time","instrument_id")
);
--> statement-breakpoint
CREATE TABLE "order_book_snapshot" (
	"time" timestamp with time zone NOT NULL,
	"instrument_id" integer NOT NULL,
	"bid_prices" numeric(12, 4)[] NOT NULL,
	"bid_quantities" integer[] NOT NULL,
	"ask_prices" numeric(12, 4)[] NOT NULL,
	"ask_quantities" integer[] NOT NULL,
	"total_bid_quantity" bigint,
	"total_ask_quantity" bigint,
	CONSTRAINT "order_book_snapshot_time_instrument_id_pk" PRIMARY KEY("time","instrument_id")
);
--> statement-breakpoint
CREATE TABLE "tick_data" (
	"time" timestamp with time zone NOT NULL,
	"instrument_id" integer NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "tick_data_time_instrument_id_pk" PRIMARY KEY("time","instrument_id")
);
--> statement-breakpoint
CREATE TABLE "order" (
	"order_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" varchar(100) NOT NULL,
	"instrument_id" integer NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(12, 4),
	"order_kind" varchar(20) NOT NULL,
	"current_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"broker_order_id" varchar(100),
	"filled_quantity" integer DEFAULT 0,
	"average_price" numeric(12, 4),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"executed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_history" (
	"order_history_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "position" (
	"position_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" varchar(100) NOT NULL,
	"instrument_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"average_entry_price" numeric(12, 4) NOT NULL,
	"current_price" numeric(12, 4),
	"unrealized_pnl" numeric(12, 2),
	"realized_pnl" numeric(12, 2) DEFAULT '0',
	"stop_loss_price" numeric(12, 4),
	"target_price" numeric(12, 4),
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now(),
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "strategy" (
	"strategy_id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" varchar,
	"class_name" varchar(100) NOT NULL,
	"config" jsonb NOT NULL,
	"is_enabled" boolean DEFAULT false,
	"execution_mode" varchar(20) DEFAULT 'PAPER',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "future" (
	"future_id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"underlying_instrument_id" integer,
	"expiry_date" date NOT NULL,
	"lot_size" integer NOT NULL,
	"tick_size" numeric(10, 4),
	"margin_percentage" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "future_instrument_id_unique" UNIQUE("instrument_id")
);
--> statement-breakpoint
CREATE TABLE "index" (
	"index_id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"index_type" varchar(50),
	"base_year" integer,
	"base_value" numeric(12, 4),
	"constituents_count" integer,
	"methodology" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "index_instrument_id_unique" UNIQUE("instrument_id")
);
--> statement-breakpoint
CREATE TABLE "index_constituent" (
	"index_constituent_id" serial PRIMARY KEY NOT NULL,
	"index_instrument_id" integer NOT NULL,
	"constituent_instrument_id" integer NOT NULL,
	"weightage" numeric(8, 4) NOT NULL,
	"shares_outstanding" bigint,
	"effective_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "valid_date_range" CHECK ("index_constituent"."end_date" IS NULL OR "index_constituent"."end_date" >= "index_constituent"."effective_date"),
	CONSTRAINT "valid_weightage" CHECK ("index_constituent"."weightage" >= 0 AND "index_constituent"."weightage" <= 100)
);
--> statement-breakpoint
CREATE TABLE "option" (
	"option_id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"underlying_instrument_id" integer NOT NULL,
	"option_type" varchar(4) NOT NULL,
	"strike_price" numeric(12, 4) NOT NULL,
	"expiry_date" date NOT NULL,
	"lot_size" integer NOT NULL,
	"tick_size" numeric(10, 4),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "option_instrument_id_unique" UNIQUE("instrument_id"),
	CONSTRAINT "option_type_check" CHECK ("option"."option_type" IN ('CALL', 'PUT'))
);
--> statement-breakpoint
CREATE TABLE "stock" (
	"stock_id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"isin" varchar(12),
	"sector" varchar(100),
	"industry" varchar(100),
	"market_cap" bigint,
	"face_value" numeric(10, 2),
	"lot_size" integer,
	"tick_size" numeric(10, 4),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "stock_instrument_id_unique" UNIQUE("instrument_id")
);
--> statement-breakpoint
ALTER TABLE "daily_ohlcv" ADD CONSTRAINT "daily_ohlcv_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ohlcv_candle" ADD CONSTRAINT "ohlcv_candle_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_interest" ADD CONSTRAINT "open_interest_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_book_snapshot" ADD CONSTRAINT "order_book_snapshot_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tick_data" ADD CONSTRAINT "tick_data_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_order_id_order_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position" ADD CONSTRAINT "position_strategy_id_strategy_strategy_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategy"("strategy_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position" ADD CONSTRAINT "position_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "future" ADD CONSTRAINT "future_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "future" ADD CONSTRAINT "future_underlying_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("underlying_instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index" ADD CONSTRAINT "index_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_constituent" ADD CONSTRAINT "index_constituent_index_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("index_instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_constituent" ADD CONSTRAINT "index_constituent_constituent_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("constituent_instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option" ADD CONSTRAINT "option_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option" ADD CONSTRAINT "option_underlying_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("underlying_instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_instrument_id_instrument_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("instrument_id") ON DELETE no action ON UPDATE no action;