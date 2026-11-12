import { Body, DriverDto } from "../../../Domain/Models";
import { FleetGateway, ListResult } from "../../../Domain/Ports";

/** Proxy do CRUD de Motoristas (Microserviço de Frota). */
export class ManageDriversUseCase {
  constructor(private readonly deps: { fleet: FleetGateway }) {}

  list(query: Record<string, string | undefined>): Promise<ListResult<DriverDto>> { return this.deps.fleet.listDrivers(query); }
  get(id: string) { return this.deps.fleet.getDriver(id); }
  create(body: Body) { return this.deps.fleet.createDriver(body); }
  update(id: string, body: Body) { return this.deps.fleet.updateDriver(id, body); }
  remove(id: string) { return this.deps.fleet.removeDriver(id); }
}
