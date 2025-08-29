import { Container } from "inversify";
import { TYPES } from "./types";
import { Server } from "@src/services/server";
import { logger } from "../logger";
import { db } from "../database";
// import { LiveApplication } from "../../main";
import { FlattradeBroker } from "@src/lib/brokers/flattrade";
import type { IBrokerService } from "../../interfaces/broker.interface";
// import { StrategyManager } from "../strategy/strategy-manager";
import { type BrokerFactory, BrokerFactoryImpl } from "./broker-factory";
import { LiveApplication } from "@src/main/live-app";
import type { ApplicationMode } from "@src/types/main/application";

// export const container = new Container();
export class ContainerSetup {
  static createContainer(mode: ApplicationMode): Container {
    const container = new Container();

    // Bind logger as a constant value since it's already configured
    container.bind(TYPES.Logger).toConstantValue(logger);
    container.bind(TYPES.Database).toConstantValue(db); // Although db is available in container but it shouldn't be used as a best practice

    // Bind server
    container.bind<Server>(TYPES.Server).to(Server).inSingletonScope();

    // Register broker implementations
    container.bind<IBrokerService>("FlattradeBroker").to(FlattradeBroker);
    // container.bind<IBrokerService>("AliceBlueBroker").to(AliceBlueBroker);
    // container.bind<IBrokerService>("PaperTradingBroker").to(PaperTradingBroker);

    // Register factory
    container.bind<BrokerFactory>("BrokerFactory").to(BrokerFactoryImpl);
    container.bind<Container>("Container").toConstantValue(container);

    // Register mode-specific services
    if (mode === "BACKTEST") {
      //   container.bind<IDataProvider>("DataProvider").to(HistoricalDataProvider);
    } else {
      //   container.bind<IDataProvider>("DataProvider").to(RealTimeDataProvider);
    }

    container.bind<LiveApplication>("LiveApplication").to(LiveApplication);

    // // Register core services
    // container.bind<ITradingEngine>("TradingEngine").to(TradingEngine);
    // container.bind<IRiskManager>("RiskManager").to(RiskManager);
    // container.bind<IStrategyManager>("StrategyManager").to(StrategyManager);

    return container;
  }
}
