-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0;
