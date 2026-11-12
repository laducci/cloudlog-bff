import { computeKpis } from "../../src/Domain/Rules/DashboardRules";
import { delivery, driver, makeContext, vehicle } from "../support";

describe("GET /aggregated-data — GetAggregatedDataUseCase", () => {
  it("junta Entregas, Frota e Function em uma resposta só", async () => {
    const { useCases, fleet } = makeContext();
    await fleet.updateVehicle("v1", {});
    const data = await useCases.getAggregatedData.execute();
    expect(data.sources).toEqual({ entregas: "ok", frota: "ok", freteFunction: "ok" });
    expect(data.deliveries).toHaveLength(2);
    expect(data.fleet.vehicles).toHaveLength(2);
    expect(data.freight.items.map((q) => q.id)).toEqual(["d1"]); // entrega Entregue não é cotada
    expect(data.deliveries[0].freightQuote?.freightCost).toBeGreaterThan(0);
    expect(data.kpis.fleet.utilizationRate).toBe(0.5);
    expect(data.warnings).toEqual([]);
  });

  it("enriquece a entrega com nome do motorista e placa do veículo", async () => {
    const { useCases } = makeContext({ deliveries: [delivery({ driverId: "m1", vehicleId: "v1", status: "Em rota" })] });
    const [d] = (await useCases.getAggregatedData.execute()).deliveries;
    expect(d).toMatchObject({ driverName: "Marcos", vehiclePlate: "BRA2E19" });
  });

  it("degrada com aviso quando uma fonte cai", async () => {
    const ctx = makeContext();
    ctx.fleet.listVehicles = async () => { throw new Error("timeout"); };
    ctx.freight.quoteMany = async () => { throw new Error("function fora"); };
    const data = await ctx.useCases.getAggregatedData.execute();
    expect(data.sources).toEqual({ entregas: "ok", frota: "indisponível", freteFunction: "indisponível" });
    expect(data.deliveries).toHaveLength(2);
    expect(data.warnings).toHaveLength(2);
  });
});

describe("Regras do dashboard", () => {
  it("conta status, atrasos e entregas sem estimativa", () => {
    const k = computeKpis(
      [delivery(), delivery({ id: "x", status: "Atrasada" }), delivery({ id: "y", status: "Entregue" })],
      [vehicle()], [driver(), driver({ id: "m2", active: false })],
      [{ freightCost: 100, etaHours: 2, estimatedDeliveryAt: "", serviceLevel: "" }, { freightCost: 50.5, etaHours: 4, estimatedDeliveryAt: "", serviceLevel: "" }],
    );
    expect(k.deliveries).toEqual({ total: 3, byStatus: { Pendente: 1, Atrasada: 1, Entregue: 1 }, delayed: 1, withoutEstimate: 2 });
    expect(k.fleet.activeDrivers).toBe(1);
    expect(k.freight).toEqual({ quotedDeliveries: 2, totalFreight: 150.5, averageEtaHours: 3 });
  });
});
