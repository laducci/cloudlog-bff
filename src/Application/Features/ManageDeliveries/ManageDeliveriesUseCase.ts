import { Body, DeliveryDto } from "../../../Domain/Models";
import { DeliveriesGateway, ListResult } from "../../../Domain/Ports";

/** Proxy do CRUD de Entregas: o frontend nunca chama o microserviço direto. */
export class ManageDeliveriesUseCase {
  constructor(private readonly deps: { deliveries: DeliveriesGateway }) {}

  list(query: Record<string, string | undefined>): Promise<ListResult<DeliveryDto>> { return this.deps.deliveries.list(query); }
  get(id: string) { return this.deps.deliveries.get(id); }
  create(body: Body) { return this.deps.deliveries.create(body); }
  update(id: string, body: Body) { return this.deps.deliveries.update(id, body); }
  remove(id: string) { return this.deps.deliveries.remove(id); }
}
