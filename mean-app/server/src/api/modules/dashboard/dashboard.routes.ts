// import { Router } from "express";
// import { dashboardController } from "./dashboard.controller.js";
// import {authMiddleware} from "../../middlewares/auth.middleware.js";

// const router = Router();

// router.get("/", authMiddleware, dashboardController.getSummary);

// export default router;



import { Router } from "express";
import { dashboardController } from "./dashboard.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// Example: GET /api/dashboard?period=monthly&year=2025&month=9
router.get("/", authMiddleware, dashboardController.getSummary);

export default router;
