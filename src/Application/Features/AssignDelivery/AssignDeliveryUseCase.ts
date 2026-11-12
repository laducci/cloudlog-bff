import { ValidationError } from "../../../Domain/Errors";
import { DeliveriesGateway, FleetGateway } from "../../../Domain/Ports";
import { assertAssignment } from "../../../Domain/Rules/AssignmentRules";

/**
 * Despachar entrega (orquestração entre os dois microserviços):
 * valida motorista e veículo, coloca a entrega "Em rota" e marca o veículo "Em uso" (com compensação se algo falhar).
 */
export class AssignDeliveryUseCase {
  constructor(private readonly deps: { deliveries: DeliveriesGateway; fleet: FleetGateway }) {}

  async execute(deliveryId: string, input: { driverId?: unknown; vehicleId?: unknown }) {
    const driverId = String(input?.driverId ?? "").trim();
    const vehicleId = String(input?.vehicleId ?? "").trim();
    if (!driverId || !vehicleId) throw new ValidationError("Informe driverId e vehicleId.");

    const [delivery, vehicle, driver] = await Promise.all([
      this.deps.deliveries.get(deliveryId),
      this.deps.fleet.getVehicle(vehicleId),
      this.deps.fleet.getDriver(driverId),
    ]);
    assertAssignment(delivery, vehicle, driver);

    // reserva o veículo primeiro; se a entrega não puder sair em rota, libera o veículo (compensação)
    await this.deps.fleet.updateVehicle(vehicleId, { status: "Em uso" });
    try {
      const updated = await this.deps.deliveries.update(deliveryId, { driverId, vehicleId, status: "Em rota" });
      return { delivery: updated, vehicle: { ...vehicle, status: "Em uso" }, driver: { id: driver.id, name: driver.name } };
    } catch (err) {
      await this.deps.fleet.updateVehicle(vehicleId, { status: "Disponível" }).catch(() => undefined);
      throw err;
    }
  }
}
