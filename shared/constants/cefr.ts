/**
 * CEFR 레벨 canonical 정의 — 진단·퀴즈·프로필이 공유하는 단일 출처.
 *
 * zod 의존이 없어 클라이언트 배럴(shared/constants)에 안전하게 노출된다.
 * 런타임 검증 스키마가 필요하면 ./cefr-schema 의 cefrLevelSchema 를 직접 import 한다.
 */
export const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_ORDER)[number];
