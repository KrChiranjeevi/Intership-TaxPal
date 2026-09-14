import { jest } from '@jest/globals';
import {
  validateAndResolveDateRange,
  calculateReportSummary,
  fetchFilteredTransactions,
  getReportPreview,
  createReport,
  getReportById,
  deleteReport
} from './reports.service.js';
import * as reportsController from './reports.controller.js';
import { prisma } from '../../../config/prisma.client.js';
import fs from 'fs-extra';
import path from 'path';

describe('Phase 6: TaxPal Reports & Export Module Tests', () => {
  const mockUserId = 'user-test-uuid-1';
  const otherUserId = 'user-test-uuid-2';

  const sampleTransactions = [
    {
      id: 'tx-1',
      userId: mockUserId,
      type: 'income',
      amount: 5000,
      category: 'Salary',
      description: 'Monthly payroll',
      date: new Date('2026-09-05T10:00:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      reportId: null,
      notes: null
    },
    {
      id: 'tx-2',
      userId: mockUserId,
      type: 'expense',
      amount: 1200,
      category: 'Housing',
      description: 'Apartment rent',
      date: new Date('2026-09-08T12:00:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      reportId: null,
      notes: null
    },
    {
      id: 'tx-3',
      userId: mockUserId,
      type: 'expense',
      amount: 300,
      category: 'Food',
      description: 'Supermarket groceries',
      date: new Date('2026-09-12T15:30:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      reportId: null,
      notes: null
    }
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. Report generation
  describe('1. Report Generation', () => {
    it('should create a report, generate physical file, and persist metadata in Prisma', async () => {
      jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue(sampleTransactions as any);
      (jest.spyOn(prisma.report, 'create') as any).mockImplementation(async ({ data }: any) => ({
        id: 'report-123',
        ...data
      }));

      const result = await createReport({
        userId: mockUserId,
        reportType: 'Financial Report',
        period: 'Current Month',
        format: 'PDF'
      });

      expect(result.id).toBe('report-123');
      expect(result.userId).toBe(mockUserId);
      expect(result.format).toBe('PDF');
      expect(result.filePath).toContain('/generated_reports/');
      expect(result.summary?.totalIncome).toBe(5000);
      expect(result.summary?.totalExpenses).toBe(1500);
    });
  });

  // 2. Date filtering
  describe('2. Date Filtering', () => {
    it('should correctly filter transactions within specified date range', async () => {
      const findSpy = jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([sampleTransactions[0]] as any);

      await fetchFilteredTransactions(mockUserId, {
        startDate: '2026-09-01',
        endDate: '2026-09-06'
      });

      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date)
            })
          })
        })
      );
    });
  });

  // 3. Type filtering
  describe('3. Type Filtering', () => {
    it('should apply transaction type filter in Prisma query', async () => {
      const findSpy = jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);

      await fetchFilteredTransactions(mockUserId, {
        period: 'Current Month',
        type: 'expense'
      });

      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            type: 'expense'
          })
        })
      );
    });
  });

  // 4. Category filtering
  describe('4. Category Filtering', () => {
    it('should apply case-insensitive category filtering in Prisma query', async () => {
      const findSpy = jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);

      await fetchFilteredTransactions(mockUserId, {
        period: 'Current Month',
        category: 'Food'
      });

      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            category: { contains: 'Food', mode: 'insensitive' }
          })
        })
      );
    });
  });

  // 5. Combined filters
  describe('5. Combined Filters', () => {
    it('should combine date, type, and category filters seamlessly', async () => {
      const findSpy = jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);

      await fetchFilteredTransactions(mockUserId, {
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        type: 'expense',
        category: 'Housing'
      });

      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            type: 'expense',
            category: { contains: 'Housing', mode: 'insensitive' },
            date: expect.any(Object)
          })
        })
      );
    });
  });

  // 6. Report summary calculations
  describe('6. Report Summary Calculations', () => {
    it('should accurately calculate totalIncome, totalExpenses, netSavings, largestExpense, and topSpendingCategory', () => {
      const summary = calculateReportSummary(sampleTransactions as any);

      expect(summary.totalIncome).toBe(5000);
      expect(summary.totalExpenses).toBe(1500);
      expect(summary.netSavings).toBe(3500);
      expect(summary.transactionCount).toBe(3);
      expect(summary.largestExpense).toBe(1200);
      expect(summary.topSpendingCategory).toBe('Housing');
    });
  });

  // 7. Empty report
  describe('7. Empty Report', () => {
    it('should return safe default summary metrics when no transactions exist', () => {
      const summary = calculateReportSummary([]);

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.netSavings).toBe(0);
      expect(summary.transactionCount).toBe(0);
      expect(summary.largestExpense).toBe(0);
      expect(summary.topSpendingCategory).toBe('N/A');
    });
  });

  // 8. Invalid date range
  describe('8. Invalid Date Range Validation', () => {
    it('should throw an error when start date is after end date', () => {
      expect(() => {
        validateAndResolveDateRange('Custom', '2026-10-15', '2026-10-01');
      }).toThrow('Start date must be before or equal to end date');
    });

    it('should throw an error when date format is invalid', () => {
      expect(() => {
        validateAndResolveDateRange('Custom', 'invalid-date', '2026-10-01');
      }).toThrow('Invalid date format');
    });
  });

  // 9. Authentication requirement
  describe('9. Authentication Requirement', () => {
    it('should reject unauthenticated preview requests with 401', async () => {
      const req: any = { user: undefined, query: {} };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await reportsController.getReportPreview(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Unauthorized' }));
    });
  });

  // 10. User ownership
  describe('10. User Ownership in Queries', () => {
    it('should strictly scope report preview and transaction lookups to the authenticated user ID', async () => {
      const findSpy = jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([]);

      await getReportPreview(mockUserId, { period: 'Current Month' });
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: mockUserId })
        })
      );
    });
  });

  // 11. User cannot access another user's report
  describe("11. User Cannot Access Another User's Report", () => {
    it("should return null / 404 when requesting a report belonging to a different user", async () => {
      jest.spyOn(prisma.report, 'findFirst').mockResolvedValue(null);

      const result = await getReportById('report-foreign-id', mockUserId);
      expect(result).toBeNull();

      const req: any = { user: { id: mockUserId }, params: { id: 'report-foreign-id' } };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await reportsController.getReportById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // 12. PDF generation
  describe('12. PDF Report Generation', () => {
    it('should generate a physical PDF file and verify its existence on disk', async () => {
      jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue(sampleTransactions as any);
      (jest.spyOn(prisma.report, 'create') as any).mockImplementation(async ({ data }: any) => ({
        id: 'pdf-test-report',
        ...data
      }));

      const report = await createReport({
        userId: mockUserId,
        reportType: 'Financial Report',
        period: 'Current Month',
        format: 'PDF'
      });

      const fullPath = path.join(process.cwd(), report.filePath.replace(/^\//, ''));
      expect(fs.existsSync(fullPath)).toBe(true);

      // Clean up test file
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
  });

  // 13. CSV generation
  describe('13. CSV Report Generation', () => {
    it('should generate a physical CSV file with columns Date, Description, Category, Type, Amount and summary rows', async () => {
      jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue(sampleTransactions as any);
      (jest.spyOn(prisma.report, 'create') as any).mockImplementation(async ({ data }: any) => ({
        id: 'csv-test-report',
        ...data
      }));

      const report = await createReport({
        userId: mockUserId,
        reportType: 'Financial Report',
        period: 'Current Month',
        format: 'CSV'
      });

      const fullPath = path.join(process.cwd(), report.filePath.replace(/^\//, ''));
      expect(fs.existsSync(fullPath)).toBe(true);

      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toContain('"Date"');
      expect(content).toContain('"Description"');
      expect(content).toContain('"Category"');
      expect(content).toContain('"Type"');
      expect(content).toContain('"Amount"');
      expect(content).toContain('Monthly payroll');
      expect(content).toContain('Apartment rent');
      expect(content).toContain('--- SUMMARY ---');
      expect(content).toContain('Total Income');

      // Clean up test file
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
  });

  // 14. Secure report download
  describe('14. Secure Report Download Handler', () => {
    it('should stream file only when report belongs to authenticated user', async () => {
      // Create a temporary file to simulate generated report
      const tempReportDir = path.join(process.cwd(), 'generated_reports');
      await fs.ensureDir(tempReportDir);
      const tempFilePath = path.join(tempReportDir, 'temp-download-test.pdf');
      fs.writeFileSync(tempFilePath, '%PDF-1.4 mock content');

      jest.spyOn(prisma.report, 'findFirst').mockResolvedValue({
        id: 'report-download-1',
        userId: mockUserId,
        filePath: '/generated_reports/temp-download-test.pdf',
        format: 'PDF',
        reportType: 'Financial Report',
        period: 'Current Month',
        color: null,
        name: 'TaxPal Report',
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedAt: new Date()
      } as any);

      const req: any = {
        user: { id: mockUserId },
        params: { id: 'report-download-1' }
      };
      const res: any = {
        setHeader: jest.fn(),
        sendFile: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await reportsController.downloadReportFile(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.sendFile).toHaveBeenCalledWith(tempFilePath);

      // Clean up temp test file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    });

    it('should return 404 if report is not owned by authenticated user', async () => {
      jest.spyOn(prisma.report, 'findFirst').mockResolvedValue(null);

      const req: any = {
        user: { id: otherUserId },
        params: { id: 'report-download-1' }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await reportsController.downloadReportFile(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Report file not found' }));
    });
  });
});
