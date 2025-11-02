import type { Request, Response } from 'express';
import * as reportsService from './reports.service.js';

const ALLOWED_PERIODS = ['Current Month', 'Last Month', 'Year'];

export async function createReport(req: Request, res: Response) {
  try {
    const { userId, reportType, period, format } = req.body;

    if (!userId || !reportType || !period || !format) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!ALLOWED_PERIODS.includes(period)) {
      return res.status(400).json({ message: `Period must be one of: ${ALLOWED_PERIODS.join(', ')}` });
    }

    const report = await reportsService.createReport({ userId, reportType, period, format });
    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create report' });
  }
}

export async function getReports(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const reports = await reportsService.getReportsByUserId(userId);
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
}

export async function getReportById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Report ID is required' });

    const report = await reportsService.getReportById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch report' });
  }
}

export async function deleteReport(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Report ID is required' });

    const report = await reportsService.deleteReport(id);
    res.json({ message: 'Report deleted', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete report' });
  }
}

export async function updateReport(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const data = req.body;
    if (!id) return res.status(400).json({ message: 'Report ID is required' });

    const report = await reportsService.updateReport(id, data);
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update report' });
  }
}
