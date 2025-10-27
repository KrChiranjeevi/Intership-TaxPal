-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "public"."Report"("userId");

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
