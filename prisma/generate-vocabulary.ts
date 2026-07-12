/**
 * @deprecated 콘텐츠 파이프라인(Phase 2)으로 대체됨.
 *
 * 이번 파이프라인의 build 는 콘텐츠를 "생성"하지 않고 검증된 source 를 재배치한다(RFC 3-1).
 * 자동 생성 대신 수동 큐레이션 source(prisma/data/vocabularies*.json)를 단일 진실로 둔다.
 * 실제 파일 삭제는 Phase 3 안정화 이후 별도 PR.
 */
console.error(
  [
    "⚠️  prisma/generate-vocabulary.ts 는 deprecated 입니다 (콘텐츠 파이프라인 Phase 2).",
    "   콘텐츠는 prisma/data/vocabularies*.json 을 직접 큐레이션하고, 검증/빌드는:",
    "     npm run content:check",
    "     npm run content:build:vocabulary",
    "   로 수행하세요.",
  ].join("\n")
);
process.exit(1);
