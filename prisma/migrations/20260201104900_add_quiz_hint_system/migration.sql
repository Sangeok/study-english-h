-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "contextHintKo" TEXT;

-- AlterTable
ALTER TABLE "UserQuizAttempt" ADD COLUMN     "hintLevel" INTEGER NOT NULL DEFAULT 0;
