/*
  Warnings:

  - A unique constraint covering the columns `[difficulty,englishWord]` on the table `QuizQuestion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_difficulty_englishWord_key" ON "QuizQuestion"("difficulty", "englishWord");
