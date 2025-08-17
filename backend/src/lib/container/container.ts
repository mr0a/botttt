import { Container } from "inversify";
import { TYPES } from "./types";
import { Server } from "../server";
import { Application } from "../application";
import { logger } from "../logger";

export const container = new Container();

// Bind logger as a constant value since it's already configured
container.bind(TYPES.Logger).toConstantValue(logger);

// Bind server
container.bind<Server>(TYPES.Server).to(Server).inSingletonScope();

// Bind application
container
  .bind<Application>(TYPES.Application)
  .to(Application)
  .inSingletonScope();
