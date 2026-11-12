const err = (description: string) => ({ description, content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } });
const idParam = { name: "id", in: "path", required: true, schema: { type: "string" } };
const json = (schema: object) => ({ "application/json": { schema } });
const obj = { type: "object", additionalProperties: true };

function proxy(tag: string, base: string, target: string, example: object) {
  const body = { required: true, content: json({ ...obj, example }) };
  return {
    [base]: {
      get: { tags: [tag], summary: `Listar (proxy → ${target})`, responses: { 200: { description: "Lista", content: json(obj) }, 502: err("Serviço indisponível") } },
      post: { tags: [tag], summary: `Cadastrar (proxy → ${target})`, requestBody: body, responses: { 201: { description: "Criado", content: json(obj) }, 400: err("Dados inválidos"), 409: err("Duplicado") } },
    },
    [`${base}/{id}`]: {
      get: { tags: [tag], summary: "Buscar por id", parameters: [idParam], responses: { 200: { description: "OK", content: json(obj) }, 404: err("Não encontrado") } },
      put: { tags: [tag], summary: "Alterar", parameters: [idParam], requestBody: body, responses: { 200: { description: "Alterado", content: json(obj) }, 422: err("Regra de negócio") } },
      delete: { tags: [tag], summary: "Excluir", parameters: [idParam], responses: { 204: { description: "Excluído" }, 404: err("Não encontrado"), 422: err("Regra de negócio") } },
    },
  };
}

/** Documento OpenAPI 3 (Swagger) do BFF Web. */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "CloudLog · BFF Web",
    version: "1.0.0",
    description:
      "Backend for Frontend do painel CloudLog. O microfrontend só conversa com este BFF (via API Gateway). " +
      "Ele agrega o Microserviço de Entregas (MongoDB), o Microserviço de Frota (Azure SQL) e a Azure Function de frete. " +
      "Alunos: Camilla Augusta Uber, João Davi, Laura Guillarducci.",
  },
  tags: [{ name: "Agregação" }, { name: "Entregas" }, { name: "Veículos" }, { name: "Motoristas" }, { name: "Frete" }],
  paths: {
    "/aggregated-data": {
      get: {
        tags: ["Agregação"],
        summary: "Dados agregados: Entregas + Frota + Function em um único JSON",
        description: "Consulta os três serviços em paralelo. Se um falhar, devolve o resto com aviso em `warnings` e `sources`.",
        responses: { 200: { description: "Resposta agregada", content: json({ $ref: "#/components/schemas/AggregatedData" }) } },
      },
    },
    "/deliveries/{id}/assign": {
      post: {
        tags: ["Entregas"],
        summary: "Despachar entrega (regra que cruza Entregas e Frota)",
        description: "Valida veículo disponível com capacidade, motorista ativo e CNH compatível; marca o veículo Em uso e a entrega Em rota.",
        parameters: [idParam],
        requestBody: { required: true, content: json({ type: "object", required: ["driverId", "vehicleId"], properties: { driverId: { type: "string" }, vehicleId: { type: "string" } } }) },
        responses: { 200: { description: "Entrega despachada", content: json(obj) }, 400: err("Dados faltando"), 404: err("Não encontrado"), 422: err("Regra de negócio") },
      },
    },
    ...proxy("Entregas", "/deliveries", "Microserviço de Entregas", { code: "ENT-1001", customer: "Mercado Bom Preço", origin: "Curitiba - PR", destination: "Joinville - SC", weightKg: 850, distanceKm: 130 }),
    ...proxy("Veículos", "/vehicles", "Microserviço de Frota", { plate: "BRA2E19", model: "Volvo FH 540", capacityKg: 25000 }),
    ...proxy("Motoristas", "/drivers", "Microserviço de Frota", { name: "Marcos Pereira", cnh: "12345678901", cnhCategory: "E", phone: "41999990000" }),
    "/freight-quote": {
      get: {
        tags: ["Frete"],
        summary: "Simular frete e prazo (proxy → Azure Function)",
        parameters: [
          { name: "distanceKm", in: "query", required: true, schema: { type: "number", example: 130 } },
          { name: "weightKg", in: "query", required: true, schema: { type: "number", example: 850 } },
        ],
        responses: { 200: { description: "Cotação", content: json(obj) }, 400: err("Parâmetros inválidos"), 502: err("Function indisponível") },
      },
    },
    "/health": { get: { tags: ["Agregação"], summary: "Health check", responses: { 200: { description: "OK" } } } },
  },
  components: {
    schemas: {
      Error: { type: "object", properties: { error: { type: "string" }, service: { type: "string" } } },
      AggregatedData: {
        type: "object",
        properties: {
          generatedAt: { type: "string", format: "date-time" },
          sources: { type: "object", properties: { entregas: { type: "string", enum: ["ok", "indisponível"] }, frota: { type: "string" }, freteFunction: { type: "string" } } },
          kpis: {
            type: "object",
            properties: {
              deliveries: { type: "object", properties: { total: { type: "integer" }, byStatus: { type: "object", additionalProperties: { type: "integer" } }, delayed: { type: "integer" }, withoutEstimate: { type: "integer" } } },
              fleet: { type: "object", properties: { vehicles: { type: "integer" }, availableVehicles: { type: "integer" }, inUseVehicles: { type: "integer" }, activeDrivers: { type: "integer" }, utilizationRate: { type: "number" } } },
              freight: { type: "object", properties: { quotedDeliveries: { type: "integer" }, totalFreight: { type: "number" }, averageEtaHours: { type: "number" } } },
            },
          },
          deliveries: { type: "array", items: { ...obj, description: "Entrega + driverName + vehiclePlate + freightQuote" } },
          fleet: { type: "object", properties: { vehicles: { type: "array", items: obj }, drivers: { type: "array", items: obj } } },
          freight: { type: "object", properties: { items: { type: "array", items: obj }, totalFreight: { type: "number" } } },
          warnings: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};
