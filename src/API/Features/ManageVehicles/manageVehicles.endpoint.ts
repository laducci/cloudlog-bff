import { Router } from "express";
import { ManageVehiclesUseCase } from "../../../Application/Features/ManageVehicles/ManageVehiclesUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

/** Proxy CRUD de veículos -> Microserviço de Frota (Azure SQL) */
export function mapManageVehicles(router: Router, useCase: ManageVehiclesUseCase) {
  router.get("/vehicles", asyncHandler(async (req, res) => { res.json(await useCase.list(req.query as Record<string, string | undefined>)); }));
  router.get("/vehicles/:id", asyncHandler(async (req, res) => { res.json(await useCase.get(req.params.id)); }));
  router.post("/vehicles", asyncHandler(async (req, res) => { res.status(201).json(await useCase.create(req.body ?? {})); }));
  router.put("/vehicles/:id", asyncHandler(async (req, res) => { res.json(await useCase.update(req.params.id, req.body ?? {})); }));
  router.delete("/vehicles/:id", asyncHandler(async (req, res) => {
    await useCase.remove(req.params.id);
    res.status(204).end();
  }));
}
