-- AlterTable
ALTER TABLE "public"."Report" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "reportId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_reportId_idx" ON "public"."Transaction"("reportId");

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
