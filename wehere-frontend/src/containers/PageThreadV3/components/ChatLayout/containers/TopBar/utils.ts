import type { Availability } from "wehere-frontend/src/typing/common";

export function formatAvailability(
  availability: Availability | null | undefined,
  currentTime: number | null | undefined
): string {
  if (!availability || !currentTime) return "-";
  if (availability.type === "available") return "Đang hoạt động";
  if (!availability.since || availability.since > currentTime + 3600000)
    return "Vắng mặt";
  const delta = currentTime - availability.since;
  if (delta < 60000) return "Vắng mặt vừa xong";
  if (delta < 5400000)
    return `Vắng mặt từ ${Math.round(delta / 60000)} phút trước`;
  if (delta < 129600000)
    return `Vắng mặt từ ${Math.round(delta / 3600000)} tiếng trước`;
  if (delta < 907200000)
    return `Vắng mặt từ ${Math.round(delta / 86400000)} ngày trước`;
  return "Vắng mặt";
}
