// server/src/api/modules/FinancialReport/FinancialReport.routes.ts
import { Router } from "express";
import * as express from "express"; 
import { generateReport } from "./FinancialReport.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";


const router = Router();
router.post("/generate", authMiddleware, generateReport);

export default router;