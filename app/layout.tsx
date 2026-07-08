import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider, ToastProvider } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Study English - 영어 학습 플랫폼",
  description:
    "AI 기반 영어 학습 플랫폼으로 진단, 어휘 퀴즈, 플래시카드 학습을 통해 영어 실력을 향상하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard — premium Korean UI typeface (replaces generic Geist) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Archivo — confident grotesque for numbers, levels & English display */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
