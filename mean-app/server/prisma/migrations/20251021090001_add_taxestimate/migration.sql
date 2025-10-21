-- AlterTable
ALTER TABLE "public"."Category" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
