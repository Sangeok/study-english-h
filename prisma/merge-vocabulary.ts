/**
 * @deprecated 콘텐츠 파이프라인(Phase 2)으로 대체됨.
 *
 * vocabulary 병합·정규화·중복 제거는 이제 build-vocabulary-artifact 가 담당한다.
 * 이 스크립트는 vocabularies-merged.json 같은 legacy 치환 파일을 만들어 source-of-truth 를
 * 흐리므로 더 이상 실행하지 않는다. 실제 파일 삭제는 Phase 3 안정화 이후 별도 PR.
 */
console.error(
  [
    "⚠️  prisma/merge-vocabulary.ts 는 deprecated 입니다 (콘텐츠 파이프라인 Phase 2).",
    "   vocabulary 병합/정규화/중복 처리는 새 파이프라인을 사용하세요:",
    "     npm run content:check              # validate + report + build 일괄",
    "     npm run content:build:vocabulary   # artifact 만 재생성",
    "   source 는 prisma/data/vocabularies*.json 만 수정하세요.",
  ].join("\n")
);
process.exit(1);
