/*
  Warnings:

  - Changed the type of `difficulty` on the `QuizQuestion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `QuizQuestion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('daily', 'business', 'toeic', 'travel', 'idioms');

-- AlterTable
ALTER TABLE "QuizQuestion"
  ALTER COLUMN "difficulty" TYPE "QuestionDifficulty" USING "difficulty"::text::"QuestionDifficulty",
  ALTER COLUMN "category" TYPE "QuestionCategory" USING "category"::text::"QuestionCategory";
