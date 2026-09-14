import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as reportsService from './reports.service.js';
import path from 'path';
import fs from 'fs';

const ALLOWED_PERIODS = ['Current Month', 'Last Month', 'Year'];
const ALLOWED_FORMATS = ['PDF', 'CSV'];

export async function createReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { reportType, period, format } = req.body;

    if (!reportType || !period || !format) {
      return res.status(400).json({ success: false, message: 'All fields (reportType, period, format) are required' });
    }

    if (!ALLOWED_PERIODS.includes(period)) {
      return res.status(400).json({ success: false, message: `Period must be one of: ${ALLOWED_PERIODS.join(', ')}` });
    }

    if (!ALLOWED_FORMATS.includes(format)) {
      return res.status(400).json({ success: false, message: `Format must be one of: ${ALLOWED_FORMATS.join(', ')}` });
    }

    const report = await reportsService.createReport({ userId, reportType, period, format });
    res.status(201).json(report);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Failed to create report' });
  }
}

export async function getReports(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const reports = await reportsService.getReportsByUserId(userId);
    res.json(reports);
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
}

export async function getReportById(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Report ID is required' });

    const report = await reportsService.getReportById(id, userId);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch report' });
  }
}

export async function deleteReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Report ID is required' });

    const report = await reportsService.deleteReport(id, userId);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json({ success: true, message: 'Report deleted successfully', report });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete report' });
  }
}

export async function updateReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    const data = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Report ID is required' });

    const report = await reportsService.updateReport(id, userId, data);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json(report);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ success: false, message: 'Failed to update report' });
  }
}

/**
 * Protected file download/preview handler:
 * Verifies authenticated user ownership before serving report file from disk.
 */
export async function downloadReportFile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Report ID is required' });

    const report = await reportsService.getReportById(id, userId);
    if (!report || !report.filePath) {
      return res.status(404).json({ success: false, message: 'Report file not found' });
    }

    // Resolve sanitized file path on disk
    const sanitizedRelPath = report.filePath.replace(/^\/?generated_reports\/?/, '');
    const fullPath = path.join(process.cwd(), 'generated_reports', sanitizedRelPath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'File no longer exists on server' });
    }

    // Determine content type
    if (report.format === 'PDF') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (report.format === 'CSV') {
      res.setHeader('Content-Type', 'text/csv');
    }

    // Stream file safely to client
    return res.sendFile(fullPath);
  } catch (err) {
    console.error('Download report error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving report file' });
  }
}
