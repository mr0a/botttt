import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../lib/database";
import {
  instrument,
  ohlcvCandle,
  dailyOhlcv,
  instrumentOrder,
  position,
  strategy,
  stock,
  option,
  future,
  index,
  type Instrument,
} from "../lib/database/schema";
import { logger } from "../lib/logger";
import type { InstrumentType } from "@src/lib/database/schema/enum";

export class DataRetrievalService {
  // Get all instruments
  async getAllInstruments() {
    try {
      const instruments = await db.select().from(instrument);
      logger.info(`Retrieved ${instruments.length} instruments`);
      return instruments;
    } catch (error) {
      logger.error(error, "Failed to retrieve instruments");
      throw error;
    }
  }

  // Get instruments by type
  async getInstrumentsByType(instrumentType: InstrumentType) {
    try {
      const instruments = await db
        .select()
        .from(instrument)
        .where(eq(instrument.instrumentType, instrumentType));
      logger.info(
        `Retrieved ${instruments.length} instruments of type ${instrumentType}`,
      );
      return instruments;
    } catch (error) {
      logger.error(
        error,
        `Failed to retrieve instruments of type ${instrumentType}`,
      );
      throw error;
    }
  }

  // Get active instruments
  async getActiveInstruments() {
    try {
      const instruments = await db
        .select()
        .from(instrument)
        .where(eq(instrument.isActive, true));
      logger.info(`Retrieved ${instruments.length} active instruments`);
      return instruments;
    } catch (error) {
      logger.error(error, "Failed to retrieve active instruments");
      throw error;
    }
  }

  // Get latest OHLCV data for an instrument
  async getLatestOhlcvData(
    instrumentId: number,
    timeframe: string,
    limit = 100,
  ) {
    try {
      const data = await db
        .select()
        .from(ohlcvCandle)
        .where(
          and(
            eq(ohlcvCandle.instrumentId, instrumentId),
            eq(ohlcvCandle.timeframe, timeframe),
          ),
        )
        .orderBy(desc(ohlcvCandle.time))
        .limit(limit);
      logger.info(
        `Retrieved ${data.length} OHLCV records for instrument ${instrumentId}`,
      );
      return data;
    } catch (error) {
      logger.error(
        error,
        `Failed to retrieve OHLCV data for instrument ${instrumentId}`,
      );
      throw error;
    }
  }

  // Get daily OHLCV data between dates
  async getDailyOhlcvBetweenDates(
    instrumentId: number,
    startDate: string,
    endDate: string,
  ) {
    try {
      const data = await db
        .select()
        .from(dailyOhlcv)
        .where(
          and(
            eq(dailyOhlcv.instrumentId, instrumentId),
            gte(dailyOhlcv.date, startDate),
            lte(dailyOhlcv.date, endDate),
          ),
        )
        .orderBy(desc(dailyOhlcv.date));
      logger.info(
        `Retrieved ${data.length} daily OHLCV records for instrument ${instrumentId} between ${startDate} and ${endDate}`,
      );
      return data;
    } catch (error) {
      logger.error(
        error,
        `Failed to retrieve daily OHLCV data for instrument ${instrumentId}`,
      );
      throw error;
    }
  }

  // Get orders for a strategy
  async getOrdersByStrategy(strategyId: string) {
    try {
      const orders = await db
        .select()
        .from(instrumentOrder)
        .where(eq(instrumentOrder.strategyId, strategyId))
        .orderBy(desc(instrumentOrder.createdAt));
      logger.info(
        `Retrieved ${orders.length} orders for strategy ${strategyId}`,
      );
      return orders;
    } catch (error) {
      logger.error(
        error,
        `Failed to retrieve orders for strategy ${strategyId}`,
      );
      throw error;
    }
  }

  // Get positions for a strategy
  async getPositionsByStrategy(strategyId: string) {
    try {
      const positions = await db
        .select()
        .from(position)
        .where(eq(position.strategyId, strategyId))
        .orderBy(desc(position.openedAt));
      logger.info(
        `Retrieved ${positions.length} positions for strategy ${strategyId}`,
      );
      return positions;
    } catch (error) {
      logger.error(
        error,
        `Failed to retrieve positions for strategy ${strategyId}`,
      );
      throw error;
    }
  }

  // Get all strategies
  async getAllStrategies() {
    try {
      const strategies = await db.select().from(strategy);
      logger.info(`Retrieved ${strategies.length} strategies`);
      return strategies;
    } catch (error) {
      logger.error(error, "Failed to retrieve strategies");
      throw error;
    }
  }

  // Get enabled strategies
  async getEnabledStrategies() {
    try {
      const strategies = await db
        .select()
        .from(strategy)
        .where(eq(strategy.isEnabled, true));
      logger.info(`Retrieved ${strategies.length} enabled strategies`);
      return strategies;
    } catch (error) {
      logger.error(error, "Failed to retrieve enabled strategies");
      throw error;
    }
  }

  // Get stocks with sector information
  async getStocksBySector(sector: string) {
    try {
      const stocks = await db
        .select({
          instrumentId: instrument.instrumentId,
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          sector: stock.sector,
          industry: stock.industry,
          marketCap: stock.marketCap,
        })
        .from(instrument)
        .innerJoin(stock, eq(instrument.instrumentId, stock.instrumentId))
        .where(eq(stock.sector, sector));
      logger.info(`Retrieved ${stocks.length} stocks in sector ${sector}`);
      return stocks;
    } catch (error) {
      logger.error(error, `Failed to retrieve stocks in sector ${sector}`);
      throw error;
    }
  }

  // Get options for an underlying instrument
  async getOptionsForUnderlying(underlyingInstrumentId: number) {
    try {
      const options = await db
        .select({
          instrumentId: instrument.instrumentId,
          symbol: instrument.symbol,
          optionType: option.optionType,
          strikePrice: option.strikePrice,
          expiryDate: option.expiryDate,
          lotSize: option.lotSize,
        })
        .from(instrument)
        .innerJoin(option, eq(instrument.instrumentId, option.instrumentId))
        .where(eq(option.underlyingInstrumentId, underlyingInstrumentId))
        .orderBy(option.expiryDate, option.strikePrice);
      logger.info(
        `Retrieved ${options.length} options for underlying instrument ${underlyingInstrumentId}`,
      );
      return options;
    } catch (error) {
      logger.error(
        error,
        `Failed to retrieve options for underlying instrument ${underlyingInstrumentId}`,
      );
      throw error;
    }
  }

  // Get futures for an underlying instrument
  async getFuturesForUnderlying(underlyingInstrumentId: number) {
    try {
      const futures = await db
        .select({
          instrumentId: instrument.instrumentId,
          symbol: instrument.symbol,
          expiryDate: future.expiryDate,
          lotSize: future.lotSize,
          marginPercentage: future.marginPercentage,
        })
        .from(instrument)
        .innerJoin(future, eq(instrument.instrumentId, future.instrumentId))
        .where(eq(future.underlyingInstrumentId, underlyingInstrumentId))
        .orderBy(future.expiryDate);
      logger.info(
        `Retrieved ${futures.length} futures for underlying instrument ${underlyingInstrumentId}`,
      );
      return futures;
    } catch (error) {
      logger.error(
        error,
        `Failed to retrieve futures for underlying instrument ${underlyingInstrumentId}`,
      );
      throw error;
    }
  }

  // Get portfolio summary for a strategy
  async getPortfolioSummary(strategyId: string) {
    try {
      const summary = await db
        .select({
          totalPositions: sql<number>`count(*)`,
          totalUnrealizedPnl: sql<number>`sum(${position.unrealizedPnl})`,
          totalRealizedPnl: sql<number>`sum(${position.realizedPnl})`,
        })
        .from(position)
        .where(eq(position.strategyId, strategyId));
      logger.info(`Retrieved portfolio summary for strategy ${strategyId}`);
      return summary[0];
    } catch (error) {
      logger.error(
        error,
        `Failed to retrieve portfolio summary for strategy ${strategyId}`,
      );
      throw error;
    }
  }

  // Get instrument with its type-specific data
  async getInstrumentWithDetails(instrumentId: number) {
    try {
      // Get base instrument data
      const baseInstrument = await db
        .select()
        .from(instrument)
        .where(eq(instrument.instrumentId, instrumentId))
        .limit(1);

      if (baseInstrument.length === 0) {
        throw new Error(`Instrument with ID ${instrumentId} not found`);
      }

      const inst = baseInstrument[0] as Instrument;
      let details = null;

      // Get type-specific details based on instrument type
      switch (inst.instrumentType) {
        case "STOCK": {
          const stockData = await db
            .select()
            .from(stock)
            .where(eq(stock.instrumentId, instrumentId))
            .limit(1);
          details = stockData[0] ?? null;
          break;
        }
        case "INDEX": {
          const indexData = await db
            .select()
            .from(index)
            .where(eq(index.instrumentId, instrumentId))
            .limit(1);
          details = indexData[0] ?? null;
          break;
        }
        case "OPTION": {
          const optionData = await db
            .select()
            .from(option)
            .where(eq(option.instrumentId, instrumentId))
            .limit(1);
          details = optionData[0] ?? null;
          break;
        }
        case "FUTURE": {
          const futureData = await db
            .select()
            .from(future)
            .where(eq(future.instrumentId, instrumentId))
            .limit(1);
          details = futureData[0] ?? null;
          break;
        }
      }

      logger.info(`Retrieved instrument ${instrumentId} with details`);
      return { instrument: inst, details };
    } catch (error) {
      logger.error(
        error,
        `Failed to retrieve instrument ${instrumentId} with details`,
      );
      throw error;
    }
  }
}

// Export a singleton instance
export const dataRetrievalService = new DataRetrievalService();
