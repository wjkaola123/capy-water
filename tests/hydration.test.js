import test from "node:test";
import assert from "node:assert/strict";
import {
  createEntry,
  dayKey,
  entriesForDay,
  totalForDay,
  weekData,
  restoreHydration,
  INITIAL_STATE,
  reminderSlots,
  nextReminder,
  companionDays,
} from "../src/hydration.js";

test("饮水记录只接受合理的整数，撤销不会影响其他记录", () => {
  for (const invalid of [0, -1, 49, 1501, NaN, 250.5, "250"])
    assert.throws(() => createEntry(invalid));
  const a = createEntry(250),
    b = createEntry(500);
  assert.equal(totalForDay([a, b]), 750);
  assert.equal(totalForDay([a, b].filter((e) => e.id !== b.id)), 250);
});
test("按本地日期分组，跨午夜和跨月不会混入前一天", () => {
  const before = new Date(2026, 9, 31, 23, 59),
    after = new Date(2026, 10, 1, 0, 1);
  const entries = [createEntry(250, before), createEntry(300, after)];
  assert.equal(dayKey(after), "2026-11-01");
  assert.equal(entriesForDay(entries, after).length, 1);
  assert.equal(totalForDay(entries, before), 250);
  assert.equal(companionDays(entries), 2);
  const week = weekData(entries, after);
  assert.equal(week.length, 7);
  assert.equal(week[5].amount, 250);
  assert.equal(week[6].amount, 300);
});
test("保存与恢复记录，去重并拒绝损坏格式", () => {
  const entry = createEntry(250);
  const restored = restoreHydration(
    JSON.stringify({
      ...INITIAL_STATE,
      entries: [entry, entry, { id: "bad", amount: -1, at: "nonsense" }],
      goal: -1,
    }),
  );
  assert.equal(restored.entries.length, 1);
  assert.equal(restored.goal, 2000);
  assert.throws(() => restoreHydration("not json"));
  assert.throws(() => restoreHydration('{"version":2}'));
});
test("提醒遵循清醒时段，过了最后一条顺延明天", () => {
  const config = { enabled: true, start: 8, end: 21, interval: 90 };
  assert.deepEqual(reminderSlots(config)[0], { hour: 8, minute: 0 });
  assert.deepEqual(reminderSlots(config).at(-1), { hour: 20, minute: 0 });
  assert.equal(
    nextReminder(config, new Date(2026, 10, 5, 20, 1)).getHours(),
    8,
  );
  assert.equal(nextReminder(config, new Date(2026, 10, 5, 20, 1)).getDate(), 6);
  assert.equal(nextReminder({ ...config, enabled: false }), null);
  assert.deepEqual(reminderSlots({ ...config, interval: 0 }), []);
});
