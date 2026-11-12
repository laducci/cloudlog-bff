/** Modelos que o BFF conhece dos serviços de backend (só o que o frontend precisa). */
export interface DeliveryDto {
  id: string;
  code: string;
  customer: string;
  origin: string;
  destination: string;
  weightKg: number;
  distanceKm: number;
  driverId: string | null;
  vehicleId: string | null;
  status: string;
  estimate: { freightCost: number; etaHours: number; estimatedDeliveryAt: string; serviceLevel: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleDto { id: string; plate: string; model: string; capacityKg: number; status: string }

export interface DriverDto { id: string; name: string; cnh: string; cnhCategory: string; phone: string; active: boolean }

export interface FreightQuoteDto {
  id?: string;
  freightCost: number;
  etaHours: number;
  estimatedDeliveryAt: string;
  serviceLevel: string;
}

export type Body = Record<string, unknown>;
