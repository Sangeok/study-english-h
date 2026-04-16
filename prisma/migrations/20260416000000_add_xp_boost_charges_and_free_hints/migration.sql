-- AlterTable: v2 소모품 재고 필드 추가
ALTER TABLE "UserProfile" ADD COLUMN "freeHintCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserProfile" ADD COLUMN "xpBoostCharges" INTEGER NOT NULL DEFAULT 0;

-- 음수 방지 CHECK 제약조건 (v1의 spendableXP_non_negative와 동일 패턴, idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'freeHintCount_non_negative') THEN
    ALTER TABLE "UserProfile" ADD CONSTRAINT "freeHintCount_non_negative" CHECK ("freeHintCount" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'xpBoostCharges_non_negative') THEN
    ALTER TABLE "UserProfile" ADD CONSTRAINT "xpBoostCharges_non_negative" CHECK ("xpBoostCharges" >= 0);
  END IF;
END
$$;
