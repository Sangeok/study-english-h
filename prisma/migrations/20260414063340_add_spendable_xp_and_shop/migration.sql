-- 기존 사용자 spendableXP 초기화 (totalXP와 동일하게)
UPDATE "UserProfile" SET "spendableXP" = "totalXP";

-- 음수 방지 CHECK 제약조건 (이미 존재하면 건너뜀)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'spendableXP_non_negative'
  ) THEN
    ALTER TABLE "UserProfile" ADD CONSTRAINT "spendableXP_non_negative" CHECK ("spendableXP" >= 0);
  END IF;
END
$$;