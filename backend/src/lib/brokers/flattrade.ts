import { injectable } from "inversify";
import type {
  IBrokerService,
  BrokerCredentials,
  AccountInfo,
  OrderRequest,
  OrderResponse,
} from "@src/interfaces/broker.interface";

@injectable()
export class FlattradeBroker implements IBrokerService {
  connect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  disconnect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getPositions(): Promise<Position[]> {
    throw new Error("Method not implemented.");
  }
  subscribeToData(_instruments: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getAccountInfo(): Promise<AccountInfo> {
    throw new Error("Method not implemented.");
  }
  async authenticate(_credentials: BrokerCredentials): Promise<void> {
    // Flattrade-specific authentication
  }

  placeOrder(_order: OrderRequest): Promise<OrderResponse> {
    // Flattrade-specific order placement
    throw new Error("Method not implemented.");
  }
}
