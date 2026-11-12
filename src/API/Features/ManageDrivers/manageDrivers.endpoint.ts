import { Router } from "express";
import { ManageDriversUseCase } from "../../../Application/Features/ManageDrivers/ManageDriversUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

/** Proxy CRUD de motoristas -> Microserviço de Frota (Azure SQL) */
export function mapManageDrivers(router: Router, useCase: ManageDriversUseCase) {
  router.get("/drivers", asyncHandler(async (req, res) => { res.json(await useCase.list(req.query as Record<string, string | undefined>)); }));
  router.get("/drivers/:id", asyncHandler(async (req, res) => { res.json(await useCase.get(req.params.id)); }));
  router.post("/drivers", asyncHandler(async (req, res) => { res.status(201).json(await useCase.create(req.body ?? {})); }));
  router.put("/drivers/:id", asyncHandler(async (req, res) => { res.json(await useCase.update(req.params.id, req.body ?? {})); }));
  router.delete("/drivers/:id", asyncHandler(async (req, res) => {
    await useCase.remove(req.params.id);
    res.status(204).end();
  }));
}
