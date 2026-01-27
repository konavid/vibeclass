/*
  Warnings:

  - Added the required column `sessionNumber` to the `course_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `course_sessions` ADD COLUMN `sessionNumber` INTEGER NOT NULL;
