export interface RelativeDateReference {
  todayKey: string;
  yesterdayKey: string;
}

export function createRelativeDateReference(now: Date): RelativeDateReference {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    todayKey: now.toDateString(),
    yesterdayKey: yesterday.toDateString(),
  };
}

export function formatRelativeDate(dateString: string, reference: RelativeDateReference): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const dateKey = date.toDateString();

  if (dateKey === reference.todayKey) {
    return "오늘";
  }

  if (dateKey === reference.yesterdayKey) {
    return "어제";
  }

  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}
