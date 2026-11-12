import { Clock, DeliveriesGateway, FleetGateway, FreightGateway } from "../Domain/Ports";
import { HttpDeliveriesGateway, HttpFleetGateway, HttpFreightGateway } from "./Http/HttpGateways";
import { HttpJsonClient } from "./Http/HttpJsonClient";
import { InMemoryDeliveriesGateway, InMemoryFleetGateway, InMemoryFreightGateway } from "./InMemory/InMemoryGateways";

export interface Infrastructure {
  deliveries: DeliveriesGateway;
  fleet: FleetGateway;
  freight: FreightGateway;
  clock: Clock;
  description: Record<string, string>;
}

export function buildInfrastructure(env: NodeJS.ProcessEnv = process.env): Infrastructure {
  const clock = { now: () => new Date() };
  if (env.BFF_GATEWAYS === "memory") {
    return {
      deliveries: new InMemoryDeliveriesGateway(), fleet: new InMemoryFleetGateway(), freight: new InMemoryFreightGateway(), clock,
      description: { gateways: "memory" },
    };
  }
  const timeoutMs = Number(env.UPSTREAM_TIMEOUT_MS ?? 10000);
  const entregas = env.ENTREGAS_SERVICE_URL ?? "http://localhost:8081";
  const frota = env.FROTA_SERVICE_URL ?? "http://localhost:8082";
  const freteFn = env.FREIGHT_FUNCTION_URL ?? "http://localhost:7071/api";
  const fnHeaders: Record<string, string> = env.FREIGHT_FUNCTION_KEY ? { "x-functions-key": env.FREIGHT_FUNCTION_KEY } : {};
  return {
    deliveries: new HttpDeliveriesGateway(new HttpJsonClient("Microserviço de Entregas", entregas, { timeoutMs })),
    fleet: new HttpFleetGateway(new HttpJsonClient("Microserviço de Frota", frota, { timeoutMs })),
    freight: new HttpFreightGateway(new HttpJsonClient("Azure Function de frete", freteFn, { timeoutMs, headers: fnHeaders })),
    clock,
    description: { gateways: "http", entregas, frota, freteFunction: freteFn },
  };
}
