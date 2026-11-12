import { DeliveryDto, DriverDto, FreightQuoteDto, VehicleDto } from "../Models";

export interface DashboardKpis {
  deliveries: { total: number; byStatus: Record<string, number>; delayed: number; withoutEstimate: number };
  fleet: { vehicles: number; availableVehicles: number; inUseVehicles: number; activeDrivers: number; utilizationRate: number };
  freight: { quotedDeliveries: number; totalFreight: number; averageEtaHours: number };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Regras puras de agregação usadas pelo GET /aggregated-data. */
export function computeKpis(deliveries: DeliveryDto[], vehicles: VehicleDto[], drivers: DriverDto[], quotes: FreightQuoteDto[]): DashboardKpis {
  const byStatus: Record<string, number> = {};
  for (const d of deliveries) byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
  const inUse = vehicles.filter((v) => v.status === "Em uso").length;
  return {
    deliveries: {
      total: deliveries.length,
      byStatus,
      delayed: byStatus["Atrasada"] ?? 0,
      withoutEstimate: deliveries.filter((d) => !d.estimate && !["Entregue", "Cancelada"].includes(d.status)).length,
    },
    fleet: {
      vehicles: vehicles.length,
      availableVehicles: vehicles.filter((v) => v.status === "Disponível").length,
      inUseVehicles: inUse,
      activeDrivers: drivers.filter((d) => d.active).length,
      utilizationRate: vehicles.length ? round2(inUse / vehicles.length) : 0,
    },
    freight: {
      quotedDeliveries: quotes.length,
      totalFreight: round2(quotes.reduce((s, q) => s + q.freightCost, 0)),
      averageEtaHours: quotes.length ? round2(quotes.reduce((s, q) => s + q.etaHours, 0) / quotes.length) : 0,
    },
  };
}

/** Entregas que ainda geram custo/prazo (as finalizadas não entram na cotação). */
export const isOpenDelivery = (d: DeliveryDto) => !["Entregue", "Cancelada"].includes(d.status);
