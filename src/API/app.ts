import cors from "cors";
import express, { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { UseCases } from "./Composition";
import { openApiDocument } from "./Docs/openapi";
import { mapAssignDelivery } from "./Features/AssignDelivery/assignDelivery.endpoint";
import { mapGetAggregatedData } from "./Features/GetAggregatedData/getAggregatedData.endpoint";
import { mapManageDeliveries } from "./Features/ManageDeliveries/manageDeliveries.endpoint";
import { mapManageDrivers } from "./Features/ManageDrivers/manageDrivers.endpoint";
import { mapManageVehicles } from "./Features/ManageVehicles/manageVehicles.endpoint";
import { mapQuoteFreight } from "./Features/QuoteFreight/quoteFreight.endpoint";
import { errorHandler } from "./Http/errorHandler";

export function createApp(useCases: UseCases, info: Record<string, string> = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => res.redirect("/docs"));
  app.get("/health", (_req, res) => res.json({ status: "ok", service: "cloudlog-bff", ...info }));
  app.get("/openapi.json", (_req, res) => res.json(openApiDocument));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: "CloudLog · BFF" }));

  const router = Router();
  mapGetAggregatedData(router, useCases.getAggregatedData);
  mapAssignDelivery(router, useCases.assignDelivery);
  mapManageDeliveries(router, useCases.manageDeliveries);
  mapManageVehicles(router, useCases.manageVehicles);
  mapManageDrivers(router, useCases.manageDrivers);
  mapQuoteFreight(router, useCases.quoteFreight);
  app.use(router);

  app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada." }));
  app.use(errorHandler);
  return app;
}
