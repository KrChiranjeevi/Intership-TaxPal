import { PrismaClient, type Report } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { parse } from 'json2csv';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';


const prisma = new PrismaClient();

export interface ReportInput {
  userId: string;
  reportType: string;
  period: string;
  format: string;
  filePath?: string; // optional, will generate dynamically
}

// Helper to generate PDF/CSV sample file
async function generateSampleFile(reportType: string, period: string, format: string, id: string): Promise<string> {
  const folder = path.join(process.cwd(), 'generated_reports');
  await fs.ensureDir(folder);

  const fileName = `${reportType}-${period}-${id}.${format.toLowerCase()}`;
  const filePath = path.join(folder, fileName);

  if (format === 'PDF') {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Add content
    doc.fontSize(20).text(`${reportType} (${period})`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Sample data for the report:', { underline: true });
    doc.text('Item 1: 100');
    doc.text('Item 2: 200');
    doc.text('Item 3: 300');

    doc.end();

    // Wait until file is fully written
    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}
 else if (format === 'CSV') {
    const sampleData = [
      { item: 'Item 1', amount: 100 },
      { item: 'Item 2', amount: 200 },
      { item: 'Item 3', amount: 300 },
    ];
    const csv = parse(sampleData);
    await fs.writeFile(filePath, csv);
  }

  return `/generated_reports/${fileName}`; // return path for frontend
}



// Create a new report
export async function createReport(data: ReportInput): Promise<Report> {
  // Generate name for frontend display
  const name = `${data.reportType} - ${data.period} (${data.format})`;

  // Generate file if filePath not provided
  const reportId = crypto.randomUUID(); // temporary id for file naming
  const filePath = data.filePath || await generateSampleFile(data.reportType, data.period, data.format, reportId);

  return prisma.report.create({
    data: {
      ...data,
      name,
      filePath,
      createdAt: new Date(),
    },
  });
}

// Get all reports for a specific user
export async function getReportsByUserId(userId: string): Promise<Report[]> {
  return prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

// Get a single report by ID
export async function getReportById(id: string): Promise<Report | null> {
  return prisma.report.findUnique({
    where: { id },
  });
}

// Delete a report by ID
export async function deleteReport(id: string): Promise<Report> {
  return prisma.report.delete({
    where: { id },
  });
}

// Update a report
export async function updateReport(id: string, data: Partial<ReportInput>): Promise<Report> {
  return prisma.report.update({
    where: { id },
    data,
  });
}
