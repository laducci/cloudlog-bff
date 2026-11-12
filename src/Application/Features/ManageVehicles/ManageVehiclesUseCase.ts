import { Body, VehicleDto } from "../../../Domain/Models";
import { FleetGateway, ListResult } from "../../../Domain/Ports";

/** Proxy do CRUD de Veículos (Microserviço de Frota). */
export class ManageVehiclesUseCase {
  constructor(private readonly deps: { fleet: FleetGateway }) {}

  list(query: Record<string, string | undefined>): Promise<ListResult<VehicleDto>> { return this.deps.fleet.listVehicles(query); }
  get(id: string) { return this.deps.fleet.getVehicle(id); }
  create(body: Body) { return this.deps.fleet.createVehicle(body); }
  update(id: string, body: Body) { return this.deps.fleet.updateVehicle(id, body); }
  remove(id: string) { return this.deps.fleet.removeVehicle(id); }
}
