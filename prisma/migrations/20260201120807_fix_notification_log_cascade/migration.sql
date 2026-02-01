-- DropForeignKey
ALTER TABLE "notification_logs" DROP CONSTRAINT "notification_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "sms_notification_logs" DROP CONSTRAINT "sms_notification_logs_userId_fkey";

-- AddForeignKey
ALTER TABLE "sms_notification_logs" ADD CONSTRAINT "sms_notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
