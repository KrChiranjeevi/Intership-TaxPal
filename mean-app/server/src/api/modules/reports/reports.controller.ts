import type { Request, Response } from 'express';
import * as reportsService from './reports.service.js';

// Create a new report
export async function createReport(req: Request, res: Response) {
  try {
    const { userId, reportType, period, format, filePath } = req.body;

    if (!userId || !reportType || !period || !format || !filePath) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const report = await reportsService.createReport({
      userId,
      reportType,
      period,
      format,
      filePath,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create report' });
  }
}

// Get all reports for the logged-in user
export async function getReports(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id; // using 'any' to bypass TS error for req.user
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const reports = await reportsService.getReportsByUserId(userId);
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
}

// Get a single report by ID
export async function getReportById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: 'Report ID is required' });
    }

    const report = await reportsService.getReportById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch report' });
  }
}

// Delete a report by ID
export async function deleteReport(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: 'Report ID is required' });
    }

    const report = await reportsService.deleteReport(id);
    res.json({ message: 'Report deleted', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete report' });
  }
}

// Update a report
export async function updateReport(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const data = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Report ID is required' });
    }

    const report = await reportsService.updateReport(id, data);
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update report' });
  }
}
