import { NextFunction, Request, Response } from "express";
import { BusinessRuleError, DomainError, UpstreamError, ValidationError } from "../../Domain/Errors";

/** 4xx dos serviços passam direto para o frontend; falhas de rede/5xx viram 502. */
export function statusFor(err: unknown): number {
  if (err instanceof ValidationError) return 400;
  if (err instanceof BusinessRuleError) return 422;
  if (err instanceof UpstreamError) return err.status >= 400 && err.status < 500 ? err.status : 502;
  return 500;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = statusFor(err);
  if (status >= 500) console.error(err);
  const message = err instanceof DomainError ? err.message : "Erro interno no BFF.";
  res.status(status).json({ error: message, ...(err instanceof UpstreamError ? { service: err.service } : {}) });
}
