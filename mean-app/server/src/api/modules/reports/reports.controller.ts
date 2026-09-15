import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as reportsService from './reports.service.js';
import path from 'path';
import fs from 'fs';

const ALLOWED_PERIODS = ['Current Month', 'Last Month', 'Quarter', 'Year', 'Custom'];
const ALLOWED_FORMATS = ['PDF', 'CSV'];

export async function getReportPreview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { period, startDate, endDate, type, category } = req.query;

    const filters = {
      period: period ? String(period) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      type: type ? (String(type) as 'all' | 'income' | 'expense') : undefined,
      category: category ? String(category) : undefined
    };

    if (filters.type && !['all', 'income', 'expense'].includes(filters.type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type filter. Allowed: 'all', 'income', 'expense'"
      });
    }

    const preview = await reportsService.getReportPreview(userId, filters);
    return res.json({ success: true, ...preview });
  } catch (error: any) {
    console.error('Report preview error:', error);
    const statusCode = error.message?.includes('Invalid') || error.message?.includes('required') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to generate report preview'
    });
  }
}

export async function createReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      reportType = 'Financial Report',
      period = 'Current Month',
      format,
      startDate,
      endDate,
      type,
      category
    } = req.body;

    if (!format) {
      return res.status(400).json({ success: false, message: 'Format (PDF or CSV) is required' });
    }

    if (!ALLOWED_FORMATS.includes(format)) {
      return res.status(400).json({ success: false, message: `Format must be one of: ${ALLOWED_FORMATS.join(', ')}` });
    }

    if (period && !ALLOWED_PERIODS.includes(period)) {
      return res.status(400).json({ success: false, message: `Period must be one of: ${ALLOWED_PERIODS.join(', ')}` });
    }

    if (type && !['all', 'income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be one of: 'all', 'income', 'expense'" });
    }

    const report = await reportsService.createReport({
      userId,
      reportType,
      period,
      format,
      startDate,
      endDate,
      type,
      category
    });

    res.status(201).json(report);
  } catch (error: any) {
    console.error('Create report error:', error);
    const statusCode = error.message?.includes('Invalid') || error.message?.includes('required') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Failed to create report' });
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

    // Resolve sanitized file path on disk with strict path traversal prevention
    const reportsDir = path.resolve(process.cwd(), 'generated_reports');
    const safeFilename = path.basename(report.filePath);
    const fullPath = path.join(reportsDir, safeFilename);

    if (!fullPath.startsWith(reportsDir) || !fs.existsSync(fullPath)) {
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
