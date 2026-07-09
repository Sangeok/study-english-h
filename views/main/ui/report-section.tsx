import { ReactNode } from "react";

interface ReportSectionProps {
  label: string;
  children: ReactNode;
  divider?: boolean;
}

/** 종이 리포트 섹션 — 좌측 라벨 레일 + 우측 콘텐츠 */
export function ReportSection({ label, children, divider = true }: ReportSectionProps) {
  return (
    <section
      className={[
        "grid gap-3 py-7 md:grid-cols-[176px_minmax(0,1fr)] md:gap-8",
        divider ? "border-t border-border-warm" : "",
      ].join(" ")}
      aria-label={label}
    >
      <div className="pt-1 text-xs font-bold tracking-[0.08em] text-teal">{label}</div>
      <div>{children}</div>
    </section>
  );
}
