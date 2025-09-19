import type { Request, Response } from "express";
import { getDashboardSummary } from "./dashboard.service.js";

export const dashboardController = {
  async getSummary(req: Request, res: Response) {
    try {
      // Assert that req has a user property
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const period = req.query.period as string; // daily | weekly | monthly
      const year = req.query.year ? Number(req.query.year) : undefined;
      const month = req.query.month ? Number(req.query.month) : undefined;
      const summary = await getDashboardSummary(userId, period,year,month);

      res.json({ success: true, data: summary });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};
