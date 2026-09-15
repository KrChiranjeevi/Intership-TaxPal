import type { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { getDashboardSummary, getAdvancedAnalytics } from "./dashboard.service.js";

export const dashboardController = {
  async getSummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const period = (req.query.period as "monthly" | "quarterly" | "yearly") || "monthly";
      const year = req.query.year ? Number(req.query.year) : undefined;
      const month = req.query.month ? Number(req.query.month) : undefined;

      const summary = await getDashboardSummary(userId, period, year, month);

      return res.json({ success: true, data: summary });
    } catch (err) {
      console.error("Dashboard error:", err);
      return res.status(500).json({ success: false, message: "Unable to load dashboard data" });
    }
  },

  async getAnalytics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const year = req.query.year ? Number(req.query.year) : undefined;
      const analytics = await getAdvancedAnalytics(userId, year);
      return res.json({ success: true, data: analytics });
    } catch (err) {
      console.error("Advanced analytics error:", err);
      return res.status(500).json({ success: false, message: "Unable to load analytics" });
    }
  },
};
