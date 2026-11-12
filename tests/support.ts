import { composeUseCases } from "../src/API/Composition";
import { DeliveryDto, DriverDto, VehicleDto } from "../src/Domain/Models";
import { InMemoryDeliveriesGateway, InMemoryFleetGateway, InMemoryFreightGateway } from "../src/Infrastructure/InMemory/InMemoryGateways";

export const delivery = (over: Partial<DeliveryDto> = {}): DeliveryDto => ({
  id: "d1", code: "ENT-1", customer: "Mercado", origin: "Curitiba", destination: "Joinville", weightKg: 850, distanceKm: 130,
  driverId: null, vehicleId: null, status: "Pendente", estimate: null, createdAt: "2026-11-12T10:00:00Z", updatedAt: "2026-11-12T10:00:00Z", ...over,
});
export const vehicle = (over: Partial<VehicleDto> = {}): VehicleDto => ({ id: "v1", plate: "BRA2E19", model: "Volvo FH", capacityKg: 25000, status: "Disponível", ...over });
export const driver = (over: Partial<DriverDto> = {}): DriverDto => ({ id: "m1", name: "Marcos", cnh: "12345678901", cnhCategory: "E", phone: "41999990000", active: true, ...over });

export function makeContext(seed: { deliveries?: DeliveryDto[]; vehicles?: VehicleDto[]; drivers?: DriverDto[] } = {}) {
  const deliveries = new InMemoryDeliveriesGateway(seed.deliveries ?? [delivery(), delivery({ id: "d2", code: "ENT-2", status: "Entregue" })]);
  const fleet = new InMemoryFleetGateway(seed.vehicles ?? [vehicle(), vehicle({ id: "v2", plate: "ABC1234", status: "Em uso" })], seed.drivers ?? [driver()]);
  const freight = new InMemoryFreightGateway();
  const useCases = composeUseCases({ deliveries, fleet, freight, clock: { now: () => new Date("2026-11-12T12:00:00Z") } });
  return { deliveries, fleet, freight, useCases };
}
