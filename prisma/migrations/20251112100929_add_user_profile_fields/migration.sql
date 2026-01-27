-- AlterTable
ALTER TABLE `users` ADD COLUMN `marketingConsent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nickname` VARCHAR(191) NULL,
    ADD COLUMN `privacyAgreed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `profileCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `termsAgreed` BOOLEAN NOT NULL DEFAULT false;
