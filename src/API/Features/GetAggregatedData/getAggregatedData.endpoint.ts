import { Router } from "express";
import { GetAggregatedDataUseCase } from "../../../Application/Features/GetAggregatedData/GetAggregatedDataUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

/** Endpoint obrigatório: GET /aggregated-data */
export function mapGetAggregatedData(router: Router, useCase: GetAggregatedDataUseCase) {
  router.get("/aggregated-data", asyncHandler(async (_req, res) => {
    res.json(await useCase.execute());
  }));
}
