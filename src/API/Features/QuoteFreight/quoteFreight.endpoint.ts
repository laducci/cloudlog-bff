import { Router } from "express";
import { QuoteFreightUseCase } from "../../../Application/Features/QuoteFreight/QuoteFreightUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

export function mapQuoteFreight(router: Router, useCase: QuoteFreightUseCase) {
  router.get("/freight-quote", asyncHandler(async (req, res) => {
    res.json(await useCase.execute({ distanceKm: req.query.distanceKm, weightKg: req.query.weightKg }));
  }));
}
