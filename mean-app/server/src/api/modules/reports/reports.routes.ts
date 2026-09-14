// src/api/modules/reports/reports.routes.ts
import { Router } from "express";
import * as reportsController from "./reports.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// Protect all routes
router.use(authMiddleware);

// Create a new report
router.post("/", reportsController.createReport);

// Get all reports for logged-in user
router.get("/", reportsController.getReports);

// Get a single report by ID
router.get("/:id", reportsController.getReportById);

// Update a report by ID
router.put("/:id", reportsController.updateReport);

// Download a report file securely (verified by authenticated user ownership)
router.get("/:id/download", reportsController.downloadReportFile);

// Delete a report by ID
router.delete("/:id", reportsController.deleteReport);

export default router;
