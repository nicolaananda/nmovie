-- Rename durationMonths to durationDays and convert values (months * 30 = days)
ALTER TABLE "SubscriptionPlan" ADD COLUMN "durationDays" INTEGER;
UPDATE "SubscriptionPlan" SET "durationDays" = "durationMonths" * 30;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "durationDays" SET NOT NULL;
ALTER TABLE "SubscriptionPlan" DROP COLUMN "durationMonths";
