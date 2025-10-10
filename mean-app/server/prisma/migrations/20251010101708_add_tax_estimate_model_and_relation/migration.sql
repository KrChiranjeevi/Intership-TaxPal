-- CreateTable
CREATE TABLE "public"."TaxEstimate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'United States',
    "state" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Single',
    "quarter" TEXT NOT NULL DEFAULT 'Q1',
    "year" INTEGER NOT NULL,
    "income" DOUBLE PRECISION NOT NULL,
    "businessExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retirement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthInsurance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "homeOffice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additionalDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxableIncome" DOUBLE PRECISION NOT NULL,
    "estimatedTax" DOUBLE PRECISION NOT NULL,
    "effectiveTaxRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxEstimate_userId_idx" ON "public"."TaxEstimate"("userId");

-- AddForeignKey
ALTER TABLE "public"."TaxEstimate" ADD CONSTRAINT "TaxEstimate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
