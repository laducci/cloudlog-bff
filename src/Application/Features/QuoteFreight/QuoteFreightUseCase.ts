import { ValidationError } from "../../../Domain/Errors";
import { FreightGateway } from "../../../Domain/Ports";

/** Simulação de frete antes de cadastrar a entrega (chama a Azure Function). */
export class QuoteFreightUseCase {
  constructor(private readonly deps: { freight: FreightGateway }) {}

  async execute(input: { distanceKm?: unknown; weightKg?: unknown }) {
    const distanceKm = Number(input?.distanceKm);
    const weightKg = Number(input?.weightKg);
    if (!(distanceKm > 0) || !(weightKg > 0)) throw new ValidationError("Informe distanceKm e weightKg maiores que zero.");
    return this.deps.freight.quote({ distanceKm, weightKg });
  }
}
