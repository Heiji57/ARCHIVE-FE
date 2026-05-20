const LOCALE = "ko-KR";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function clone(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function addDays(date: Date, amount: number) {
  const next = clone(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeek(date: Date) {
  const next = clone(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function todayKey() {
  return toDateKey(new Date());
}

export function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

export function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    year: "numeric",
    month: "long",
  }).format(date);
}

export function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

export function getMonthGrid(date: Date) {
  const calendarStart = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
}
