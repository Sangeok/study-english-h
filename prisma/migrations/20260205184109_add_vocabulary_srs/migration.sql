-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "masteredWords" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewNeeded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalWordLearned" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "vocabularies" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "pronunciation" TEXT,
    "exampleSentence" TEXT,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vocabularies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "masteryLevel" TEXT NOT NULL DEFAULT 'new',
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "vocabularyCount" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcard_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vocabularies_word_key" ON "vocabularies"("word");

-- CreateIndex
CREATE INDEX "vocabularies_level_category_idx" ON "vocabularies"("level", "category");

-- CreateIndex
CREATE INDEX "user_vocabularies_userId_nextReviewDate_idx" ON "user_vocabularies"("userId", "nextReviewDate");

-- CreateIndex
CREATE INDEX "user_vocabularies_userId_masteryLevel_idx" ON "user_vocabularies"("userId", "masteryLevel");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocabularies_userId_vocabularyId_key" ON "user_vocabularies"("userId", "vocabularyId");

-- CreateIndex
CREATE INDEX "flashcard_sessions_userId_createdAt_idx" ON "flashcard_sessions"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "user_vocabularies" ADD CONSTRAINT "user_vocabularies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabularies" ADD CONSTRAINT "user_vocabularies_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_sessions" ADD CONSTRAINT "flashcard_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
