import { BusinessRuleError } from "../Errors";
import { DeliveryDto, DriverDto, VehicleDto } from "../Models";

/**
 * Regra de negócio que cruza os dois domínios (Entregas x Frota):
 * para colocar uma entrega em rota, motorista e veículo precisam estar aptos.
 */
export function assertAssignment(delivery: DeliveryDto, vehicle: VehicleDto, driver: DriverDto): void {
  if (delivery.status !== "Pendente") throw new BusinessRuleError(`Só entregas pendentes podem ser despachadas (atual: ${delivery.status}).`);
  if (vehicle.status !== "Disponível") throw new BusinessRuleError(`O veículo ${vehicle.plate} não está disponível (${vehicle.status}).`);
  if (delivery.weightKg > vehicle.capacityKg) {
    throw new BusinessRuleError(`A carga (${delivery.weightKg} kg) passa da capacidade do veículo ${vehicle.plate} (${vehicle.capacityKg} kg).`);
  }
  if (!driver.active) throw new BusinessRuleError(`O motorista ${driver.name} está inativo.`);
  if (driver.cnhCategory === "B" && delivery.weightKg > 3500) {
    throw new BusinessRuleError(`CNH categoria B não permite conduzir carga acima de 3500 kg.`);
  }
}
