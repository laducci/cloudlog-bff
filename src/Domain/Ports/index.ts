import { Body, DeliveryDto, DriverDto, FreightQuoteDto, VehicleDto } from "../Models";

export interface ListResult<T> { items: T[]; total: number }

/** Microserviço 1 - Entregas (MongoDB). */
export interface DeliveriesGateway {
  list(query: Record<string, string | undefined>): Promise<ListResult<DeliveryDto>>;
  get(id: string): Promise<DeliveryDto>;
  create(body: Body): Promise<DeliveryDto>;
  update(id: string, body: Body): Promise<DeliveryDto>;
  remove(id: string): Promise<void>;
}

/** Microserviço 2 - Frota (Azure SQL). */
export interface FleetGateway {
  listVehicles(query: Record<string, string | undefined>): Promise<ListResult<VehicleDto>>;
  getVehicle(id: string): Promise<VehicleDto>;
  createVehicle(body: Body): Promise<VehicleDto>;
  updateVehicle(id: string, body: Body): Promise<VehicleDto>;
  removeVehicle(id: string): Promise<void>;
  listDrivers(query: Record<string, string | undefined>): Promise<ListResult<DriverDto>>;
  getDriver(id: string): Promise<DriverDto>;
  createDriver(body: Body): Promise<DriverDto>;
  updateDriver(id: string, body: Body): Promise<DriverDto>;
  removeDriver(id: string): Promise<void>;
}

/** Azure Function - cálculo de frete/prazo (HTTP Trigger). */
export interface FreightGateway {
  quote(input: { distanceKm: number; weightKg: number }): Promise<FreightQuoteDto>;
  quoteMany(items: Array<{ id: string; distanceKm: number; weightKg: number }>): Promise<{ items: FreightQuoteDto[]; totalFreight: number }>;
}

export interface Clock { now(): Date }
