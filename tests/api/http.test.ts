import request from "supertest";
import { createApp } from "../../src/API/app";
import { makeContext } from "../support";

describe("API HTTP do BFF", () => {
  it("GET /aggregated-data retorna tudo em um único JSON", async () => {
    const res = await request(createApp(makeContext().useCases)).get("/aggregated-data").expect(200);
    expect(Object.keys(res.body)).toEqual(["generatedAt", "sources", "kpis", "deliveries", "fleet", "freight", "warnings"]);
  });

  it("faz proxy do CRUD e repassa erros 4xx dos serviços", async () => {
    const app = createApp(makeContext().useCases);
    const { body } = await request(app).post("/vehicles").send({ plate: "XYZ9A88", model: "Scania", capacityKg: 18000 }).expect(201);
    await request(app).get(`/vehicles/${body.id}`).expect(200);
    await request(app).put(`/vehicles/${body.id}`).send({ model: "Scania R450" }).expect(200);
    await request(app).delete(`/vehicles/${body.id}`).expect(204);
    await request(app).get(`/vehicles/${body.id}`).expect(404);
    await request(app).get("/deliveries").expect(200);
    await request(app).get("/drivers").expect(200);
  });

  it("despacho com regra violada devolve 422 e simulação de frete valida parâmetros", async () => {
    const app = createApp(makeContext().useCases);
    await request(app).post("/deliveries/d2/assign").send({ driverId: "m1", vehicleId: "v1" }).expect(422);
    await request(app).post("/deliveries/d1/assign").send({ driverId: "m1", vehicleId: "v1" }).expect(200);
    await request(app).get("/freight-quote?distanceKm=0&weightKg=1").expect(400);
    await request(app).get("/freight-quote?distanceKm=100&weightKg=1").expect(200);
  });

  it("serviço fora do ar vira 502", async () => {
    const ctx = makeContext();
    ctx.deliveries.list = async () => { const { UpstreamError } = await import("../../src/Domain/Errors"); throw new UpstreamError("Entregas", 503, "fora"); };
    await request(createApp(ctx.useCases)).get("/deliveries").expect(502);
  });

  it("expõe Swagger e health", async () => {
    const app = createApp(makeContext().useCases);
    await request(app).get("/docs/").expect(200);
    expect((await request(app).get("/openapi.json")).body.paths).toHaveProperty("/aggregated-data");
  });
});
