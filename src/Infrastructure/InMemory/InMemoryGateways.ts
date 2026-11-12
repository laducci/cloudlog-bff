import { UpstreamError } from "../../Domain/Errors";
import { Body, DeliveryDto, DriverDto, FreightQuoteDto, VehicleDto } from "../../Domain/Models";
import { DeliveriesGateway, FleetGateway, FreightGateway } from "../../Domain/Ports";

/** Tabela genérica em memória (dados de exemplo para testes e para rodar o BFF sozinho). */
class Table<T extends { id: string }> {
  private seq = 0;
  constructor(private readonly service: string, readonly rows: T[] = []) {}
  all() { return { items: [...this.rows], total: this.rows.length }; }
  get(id: string): T {
    const row = this.rows.find((r) => r.id === id);
    if (!row) throw new UpstreamError(this.service, 404, "Registro não encontrado.");
    return row;
  }
  create(body: Body, defaults: Partial<T>): T {
    const row = { ...defaults, ...body, id: `${this.service}-${++this.seq}` } as unknown as T;
    this.rows.push(row);
    return row;
  }
  update(id: string, body: Body): T { return Object.assign(this.get(id), body); }
  remove(id: string) { this.rows.splice(this.rows.indexOf(this.get(id)), 1); }
}

export class InMemoryDeliveriesGateway implements DeliveriesGateway {
  readonly table: Table<DeliveryDto>;
  constructor(rows: DeliveryDto[] = []) { this.table = new Table("entregas", rows); }
  async list() { return this.table.all(); }
  async get(id: string) { return this.table.get(id); }
  async create(b: Body) {
    const now = new Date().toISOString();
    return this.table.create(b, { status: "Pendente", estimate: null, driverId: null, vehicleId: null, createdAt: now, updatedAt: now } as Partial<DeliveryDto>);
  }
  async update(id: string, b: Body) { return this.table.update(id, b); }
  async remove(id: string) { this.table.remove(id); }
}

export class InMemoryFleetGateway implements FleetGateway {
  readonly vehicles: Table<VehicleDto>;
  readonly drivers: Table<DriverDto>;
  constructor(vehicles: VehicleDto[] = [], drivers: DriverDto[] = []) {
    this.vehicles = new Table("veiculos", vehicles);
    this.drivers = new Table("motoristas", drivers);
  }
  async listVehicles() { return this.vehicles.all(); }
  async getVehicle(id: string) { return this.vehicles.get(id); }
  async createVehicle(b: Body) { return this.vehicles.create(b, { status: "Disponível" } as Partial<VehicleDto>); }
  async updateVehicle(id: string, b: Body) { return this.vehicles.update(id, b); }
  async removeVehicle(id: string) { this.vehicles.remove(id); }
  async listDrivers() { return this.drivers.all(); }
  async getDriver(id: string) { return this.drivers.get(id); }
  async createDriver(b: Body) { return this.drivers.create(b, { active: true } as Partial<DriverDto>); }
  async updateDriver(id: string, b: Body) { return this.drivers.update(id, b); }
  async removeDriver(id: string) { this.drivers.remove(id); }
}

/** Cálculo simplificado só para demonstração local (o real fica na Azure Function). */
export class InMemoryFreightGateway implements FreightGateway {
  async quote(i: { distanceKm: number; weightKg: number }): Promise<FreightQuoteDto> {
    const etaHours = Math.round((1.5 + i.distanceKm / 62) * 100) / 100;
    return {
      freightCost: Math.round((120 + i.distanceKm * 2.35 + i.distanceKm * i.weightKg * 0.00025) * 100) / 100,
      etaHours, estimatedDeliveryAt: new Date(Date.now() + etaHours * 3600000).toISOString(),
      serviceLevel: i.distanceKm <= 150 ? "Expresso" : "Padrão",
    };
  }
  async quoteMany(items: Array<{ id: string; distanceKm: number; weightKg: number }>) {
    const quoted = await Promise.all(items.map(async (i) => ({ id: i.id, ...(await this.quote(i)) })));
    return { items: quoted, totalFreight: Math.round(quoted.reduce((s, q) => s + q.freightCost, 0) * 100) / 100 };
  }
}
