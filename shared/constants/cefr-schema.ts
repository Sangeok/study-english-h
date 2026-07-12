import { z } from "zod";
import { CEFR_ORDER } from "./cefr";

/**
 * CEFR 레벨 런타임 검증 스키마 — 단일 출처 CEFR_ORDER 에서 파생한다.
 *
 * zod 를 물고 오므로 shared/constants 배럴에는 노출하지 않는다.
 * 검증이 필요한 소비처(API 라우트 등)가 이 경로를 직접 import 한다.
 */
export const cefrLevelSchema = z.enum(CEFR_ORDER);
