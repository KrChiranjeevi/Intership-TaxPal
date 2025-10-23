// server/src/api/modules/FinancialReport/FinancialReport.controller.ts

import { Router } from "express"; 
import type { Request, Response } from "express";

import { generateReportData, exportToCSV } from "./FinancialReport.service.js";

type AuthRequest = Request & { user?: { id: string } };

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Please log in." });
    }

    const { reportType, period, format } = req.body;

    const reportData = await generateReportData(userId, reportType, period);

    if (format === 'CSV') {
      const csv = await exportToCSV(reportData);
      res.setHeader("Content-Type", "text/csv");
      res.attachment(`financial_report_${period}.csv`);
      return res.send(csv);
    }
    
    // Default response is JSON
    res.status(200).json({ success: true, data: reportData });
    
  } catch (error: any) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Error generating report", error: error.message });
  }
};