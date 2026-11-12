import { Body, DeliveryDto, DriverDto, FreightQuoteDto, VehicleDto } from "../../Domain/Models";
import { DeliveriesGateway, FleetGateway, FreightGateway, ListResult } from "../../Domain/Ports";
import { HttpJsonClient } from "./HttpJsonClient";

type Q = Record<string, string | undefined>;
const enc = encodeURIComponent;

/** Adaptador HTTP para o Microserviço de Entregas. */
export class HttpDeliveriesGateway implements DeliveriesGateway {
  constructor(private readonly http: HttpJsonClient) {}
  list(q: Q) { return this.http.request<ListResult<DeliveryDto>>("GET", "/deliveries", undefined, q); }
  get(id: string) { return this.http.request<DeliveryDto>("GET", `/deliveries/${enc(id)}`); }
  create(b: Body) { return this.http.request<DeliveryDto>("POST", "/deliveries", b); }
  update(id: string, b: Body) { return this.http.request<DeliveryDto>("PUT", `/deliveries/${enc(id)}`, b); }
  remove(id: string) { return this.http.request<void>("DELETE", `/deliveries/${enc(id)}`); }
}

/** Adaptador HTTP para o Microserviço de Frota. */
export class HttpFleetGateway implements FleetGateway {
  constructor(private readonly http: HttpJsonClient) {}
  listVehicles(q: Q) { return this.http.request<ListResult<VehicleDto>>("GET", "/vehicles", undefined, q); }
  getVehicle(id: string) { return this.http.request<VehicleDto>("GET", `/vehicles/${enc(id)}`); }
  createVehicle(b: Body) { return this.http.request<VehicleDto>("POST", "/vehicles", b); }
  updateVehicle(id: string, b: Body) { return this.http.request<VehicleDto>("PUT", `/vehicles/${enc(id)}`, b); }
  removeVehicle(id: string) { return this.http.request<void>("DELETE", `/vehicles/${enc(id)}`); }
  listDrivers(q: Q) { return this.http.request<ListResult<DriverDto>>("GET", "/drivers", undefined, q); }
  getDriver(id: string) { return this.http.request<DriverDto>("GET", `/drivers/${enc(id)}`); }
  createDriver(b: Body) { return this.http.request<DriverDto>("POST", "/drivers", b); }
  updateDriver(id: string, b: Body) { return this.http.request<DriverDto>("PUT", `/drivers/${enc(id)}`, b); }
  removeDriver(id: string) { return this.http.request<void>("DELETE", `/drivers/${enc(id)}`); }
}

/** Adaptador HTTP para a Azure Function de frete. */
export class HttpFreightGateway implements FreightGateway {
  constructor(private readonly http: HttpJsonClient) {}
  quote(input: { distanceKm: number; weightKg: number }) { return this.http.request<FreightQuoteDto>("POST", "/frete", input); }
  quoteMany(items: Array<{ id: string; distanceKm: number; weightKg: number }>) {
    return this.http.request<{ items: FreightQuoteDto[]; totalFreight: number }>("POST", "/frete", items);
  }
}
