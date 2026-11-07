export const STORAGE_KEY = "@capy-water/v1";
export const INITIAL_STATE = {
  version: 1,
  entries: [],
  goal: 2000,
  accessory: "orange",
  effect: "hearts",
  beverage: "tea",
  motion: true,
  reminder: { enabled: false, interval: 90, start: 8, end: 21 },
};

export function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function validAmount(amount) {
  return Number.isInteger(amount) && amount >= 50 && amount <= 1500;
}
export function createEntry(amount, now = new Date()) {
  if (!validAmount(amount)) throw new Error("请输入 50–1500 ml 之间的整数");
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
    amount,
    at: now.toISOString(),
  };
}
export function entriesForDay(entries, date = new Date()) {
  const key = dayKey(date);
  return entries
    .filter((e) => dayKey(e.at) === key)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}
export function totalForDay(entries, date = new Date()) {
  return entriesForDay(entries, date).reduce((sum, e) => sum + e.amount, 0);
}
export function weekData(entries, now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - 6 + i);
    return {
      key: dayKey(date),
      label:
        i === 6
          ? "今天"
          : ["日", "一", "二", "三", "四", "五", "六"][date.getDay()],
      amount: totalForDay(entries, date),
      date,
    };
  });
}
export function companionDays(entries) {
  return new Set(entries.map((e) => dayKey(e.at))).size;
}

export function waterGardenData(entries, range = 7, now = new Date()) {
  const length = [7, 30, 90].includes(range) ? range : 7;
  const totals = new Map();
  for (const entry of entries) {
    const key = dayKey(entry.at);
    const previous = totals.get(key) || { amount: 0, cups: 0 };
    totals.set(key, { amount: previous.amount + entry.amount, cups: previous.cups + 1 });
  }
  const days = Array.from({ length }, (_, index) => {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - length + 1 + index);
    const key = dayKey(date);
    return { key, date, ...(totals.get(key) || { amount: 0, cups: 0 }) };
  });
  const total = days.reduce((sum, day) => sum + day.amount, 0);
  const recordedDays = days.filter((day) => day.cups > 0).length;
  return { days, total, recordedDays, average: recordedDays ? Math.round(total / recordedDays) : 0 };
}
export function reminderSlots({ start, end, interval }) {
  const slots = [];
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end > 23 ||
    start >= end ||
    ![60, 90, 120].includes(interval)
  )
    return slots;
  for (let minute = start * 60; minute < end * 60; minute += interval)
    slots.push({ hour: Math.floor(minute / 60), minute: minute % 60 });
  return slots;
}
export function nextReminder(reminder, now = new Date()) {
  if (!reminder.enabled) return null;
  const slots = reminderSlots(reminder);
  for (let day = 0; day < 2; day++) {
    for (const slot of slots) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      date.setHours(slot.hour, slot.minute, 0, 0);
      if (date > now) return date;
    }
  }
  return null;
}
export function restoreHydration(raw) {
  if (!raw)
    return {
      ...INITIAL_STATE,
      entries: [],
      reminder: { ...INITIAL_STATE.reminder },
    };
  const input = JSON.parse(raw);
  if (!input || input.version !== 1 || !Array.isArray(input.entries))
    throw new Error("记录格式无法识别");
  const ids = new Set();
  const entries = input.entries.filter((e) => {
    if (
      !e ||
      typeof e.id !== "string" ||
      ids.has(e.id) ||
      !validAmount(e.amount) ||
      !Number.isFinite(Date.parse(e.at))
    )
      return false;
    ids.add(e.id);
    return true;
  });
  const reminder = reminderSlots(input.reminder || {}).length
    ? { ...input.reminder, enabled: input.reminder.enabled === true }
    : { ...INITIAL_STATE.reminder };
  return {
    ...INITIAL_STATE,
    entries,
    reminder,
    goal:
      Number.isInteger(input.goal) && input.goal >= 500 && input.goal <= 5000
        ? input.goal
        : 2000,
    accessory: ["orange", "flower", "towel"].includes(input.accessory)
      ? input.accessory
      : "orange",
    motion: input.motion !== false,
    effect: ["hearts", "stars", "petals"].includes(input.effect)
      ? input.effect
      : "hearts",
    beverage: ["tea", "coffee", "juice"].includes(input.beverage)
      ? input.beverage
      : "tea",
  };
}
