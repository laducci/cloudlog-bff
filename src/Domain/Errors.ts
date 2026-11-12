export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class ValidationError extends DomainError {}
export class BusinessRuleError extends DomainError {}

/** Erro vindo de um serviço de backend (microserviço ou Function). */
export class UpstreamError extends DomainError {
  constructor(readonly service: string, readonly status: number, message: string) {
    super(message);
  }
}
