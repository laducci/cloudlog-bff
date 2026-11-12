import { BusinessRuleError, ValidationError } from "../../src/Domain/Errors";
import { delivery, driver, makeContext, vehicle } from "../support";

describe("AssignDelivery (regra entre Entregas e Frota)", () => {
  it("despacha: entrega Em rota e veículo Em uso", async () => {
    const { useCases, deliveries, fleet } = makeContext();
    const r = await useCases.assignDelivery.execute("d1", { driverId: "m1", vehicleId: "v1" });
    expect(r.delivery.status).toBe("Em rota");
    expect((await deliveries.get("d1")).vehicleId).toBe("v1");
    expect((await fleet.getVehicle("v1")).status).toBe("Em uso");
  });

  it("bloqueia veículo indisponível, carga acima da capacidade, motorista inativo e CNH B com carga pesada", async () => {
    const cases = [
      makeContext({ vehicles: [vehicle({ status: "Manutenção" })] }),
      makeContext({ vehicles: [vehicle({ capacityKg: 500 })] }),
      makeContext({ drivers: [driver({ active: false })] }),
      makeContext({ drivers: [driver({ cnhCategory: "B" })], deliveries: [delivery({ weightKg: 5000 })] }),
      makeContext({ deliveries: [delivery({ status: "Entregue" })] }),
    ];
    for (const { useCases } of cases) {
      await expect(useCases.assignDelivery.execute("d1", { driverId: "m1", vehicleId: "v1" })).rejects.toBeInstanceOf(BusinessRuleError);
    }
  });

  it("libera o veículo se a entrega não puder sair em rota (compensação)", async () => {
    const { useCases, deliveries, fleet } = makeContext();
    deliveries.update = async () => { throw new Error("entregas fora do ar"); };
    await expect(useCases.assignDelivery.execute("d1", { driverId: "m1", vehicleId: "v1" })).rejects.toThrow();
    expect((await fleet.getVehicle("v1")).status).toBe("Disponível");
  });

  it("exige driverId e vehicleId", async () => {
    await expect(makeContext().useCases.assignDelivery.execute("d1", {})).rejects.toBeInstanceOf(ValidationError);
  });
});
