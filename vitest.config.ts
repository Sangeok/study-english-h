import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// tsconfig 의 "@/*": ["./*"] 별칭을 vitest 런타임에도 재현한다.
// (서버 모듈이 @/lib/db 같은 값 import 를 쓰면 이 별칭 없이는 해석 실패)
const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "happy-dom",
  },
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
});
