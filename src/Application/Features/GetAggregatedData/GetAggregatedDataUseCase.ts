import { DeliveryDto, DriverDto, FreightQuoteDto, VehicleDto } from "../../../Domain/Models";
import { Clock, DeliveriesGateway, FleetGateway, FreightGateway } from "../../../Domain/Ports";
import { DashboardKpis, computeKpis, isOpenDelivery } from "../../../Domain/Rules/DashboardRules";

type SourceStatus = "ok" | "indisponível";

export interface AggregatedDelivery extends DeliveryDto {
  driverName: string | null;
  vehiclePlate: string | null;
  freightQuote: FreightQuoteDto | null;
}

export interface AggregatedData {
  generatedAt: string;
  sources: { entregas: SourceStatus; frota: SourceStatus; freteFunction: SourceStatus };
  kpis: DashboardKpis;
  deliveries: AggregatedDelivery[];
  fleet: { vehicles: VehicleDto[]; drivers: DriverDto[] };
  freight: { items: FreightQuoteDto[]; totalFreight: number };
  warnings: string[];
}

const value = <T>(r: PromiseSettledResult<T>, fallback: T): T => (r.status === "fulfilled" ? r.value : fallback);
const status = (r: PromiseSettledResult<unknown>): SourceStatus => (r.status === "fulfilled" ? "ok" : "indisponível");

/**
 * GET /aggregated-data - consulta em paralelo o Microserviço de Entregas (MongoDB),
 * o Microserviço de Frota (Azure SQL) e a Azure Function, e devolve um único JSON.
 * Se uma fonte falhar, as outras continuam aparecendo (degradação parcial).
 */
export class GetAggregatedDataUseCase {
  constructor(private readonly deps: { deliveries: DeliveriesGateway; fleet: FleetGateway; freight: FreightGateway; clock: Clock }) {}

  async execute(): Promise<AggregatedData> {
    const [deliveriesR, vehiclesR, driversR] = await Promise.allSettled([
      this.deps.deliveries.list({ limit: "100" }),
      this.deps.fleet.listVehicles({}),
      this.deps.fleet.listDrivers({}),
    ]);
    const deliveries = value(deliveriesR, { items: [], total: 0 }).items;
    const vehicles = value(vehiclesR, { items: [], total: 0 }).items;
    const drivers = value(driversR, { items: [], total: 0 }).items;

    const open = deliveries.filter(isOpenDelivery);
    const [freightR] = await Promise.allSettled([
      open.length ? this.deps.freight.quoteMany(open.map((d) => ({ id: d.id, distanceKm: d.distanceKm, weightKg: d.weightKg }))) : Promise.resolve({ items: [], totalFreight: 0 }),
    ]);
    const freight = value(freightR, { items: [], totalFreight: 0 });

    const warnings: string[] = [];
    if (deliveriesR.status === "rejected") warnings.push("Microserviço de Entregas indisponível.");
    if (vehiclesR.status === "rejected" || driversR.status === "rejected") warnings.push("Microserviço de Frota indisponível.");
    if (freightR.status === "rejected") warnings.push("Function de frete indisponível: valores de frete não calculados.");

    const driverName = new Map(drivers.map((d) => [d.id, d.name]));
    const vehiclePlate = new Map(vehicles.map((v) => [v.id, v.plate]));
    const quoteById = new Map(freight.items.map((q) => [q.id, q]));

    return {
      generatedAt: this.deps.clock.now().toISOString(),
      sources: {
        entregas: status(deliveriesR),
        frota: vehiclesR.status === "fulfilled" && driversR.status === "fulfilled" ? "ok" : "indisponível",
        freteFunction: open.length ? status(freightR) : "ok",
      },
      kpis: computeKpis(deliveries, vehicles, drivers, freight.items),
      deliveries: deliveries.map((d) => ({
        ...d,
        driverName: d.driverId ? driverName.get(d.driverId) ?? null : null,
        vehiclePlate: d.vehicleId ? vehiclePlate.get(d.vehicleId) ?? null : null,
        freightQuote: quoteById.get(d.id) ?? null,
      })),
      fleet: { vehicles, drivers },
      freight,
      warnings,
    };
  }
}
