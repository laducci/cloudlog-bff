import { Router } from "express";
import { ManageDeliveriesUseCase } from "../../../Application/Features/ManageDeliveries/ManageDeliveriesUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

/** Proxy CRUD de entregas -> Microserviço de Entregas (MongoDB) */
export function mapManageDeliveries(router: Router, useCase: ManageDeliveriesUseCase) {
  router.get("/deliveries", asyncHandler(async (req, res) => { res.json(await useCase.list(req.query as Record<string, string | undefined>)); }));
  router.get("/deliveries/:id", asyncHandler(async (req, res) => { res.json(await useCase.get(req.params.id)); }));
  router.post("/deliveries", asyncHandler(async (req, res) => { res.status(201).json(await useCase.create(req.body ?? {})); }));
  router.put("/deliveries/:id", asyncHandler(async (req, res) => { res.json(await useCase.update(req.params.id, req.body ?? {})); }));
  router.delete("/deliveries/:id", asyncHandler(async (req, res) => {
    await useCase.remove(req.params.id);
    res.status(204).end();
  }));
}
