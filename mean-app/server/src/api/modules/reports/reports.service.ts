import { PrismaClient, type Report } from '@prisma/client';

const prisma = new PrismaClient();

export interface ReportInput {
  userId: string;
  reportType: string;
  period: string;
  format: string;
  filePath: string;
}

// Create a new report
export async function createReport(data: ReportInput): Promise<Report> {
  // Dynamically generate a name for frontend display
  const name = `${data.reportType} - ${data.period} (${data.format})`;

  return prisma.report.create({
    data: {
      ...data,
      name,               // added for frontend
      createdAt: new Date(), // updated from generatedAt to createdAt
    },
  });
}

// Get all reports for a specific user
export async function getReportsByUserId(userId: string): Promise<Report[]> {
  return prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }, // updated from generatedAt to createdAt
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
export async function updateReport(
  id: string,
  data: Partial<ReportInput>
): Promise<Report> {
  return prisma.report.update({
    where: { id },
    data,
  });
}
