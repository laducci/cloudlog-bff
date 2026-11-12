import { Router } from "express";
import { AssignDeliveryUseCase } from "../../../Application/Features/AssignDelivery/AssignDeliveryUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

export function mapAssignDelivery(router: Router, useCase: AssignDeliveryUseCase) {
  router.post("/deliveries/:id/assign", asyncHandler(async (req, res) => {
    res.json(await useCase.execute(req.params.id, req.body ?? {}));
  }));
}
