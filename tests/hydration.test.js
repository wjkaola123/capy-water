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
  waterGardenData,
  weeklyWaterGarden,
} from "../src/hydration.js";

test("水分花园按本地日期统计7天和4周，平均值只计记录日", () => {
  const now = new Date(2027, 0, 2, 0, 5);
  const entries = [
    createEntry(250, new Date(2026, 11, 31, 23, 59)),
    createEntry(500, new Date(2027, 0, 2, 0, 1)),
    createEntry(250, new Date(2027, 0, 2, 0, 2)),
    createEntry(1000, new Date(2027, 0, 3)),
    createEntry(1000, new Date(2026, 8, 1)),
  ];
  for (const range of [7, 28]) {
    const result = waterGardenData(entries, range, now);
    assert.equal(result.days.length, range);
    assert.equal(result.days.at(-1).key, "2027-01-02");
    assert.equal(result.days.at(-1).cups, 2);
    assert.equal(result.total, 1000);
    assert.equal(result.recordedDays, 2);
    assert.equal(result.average, 500);
  }
  assert.equal(waterGardenData([], 28, now).average, 0);
  assert.equal(waterGardenData([], 28, new Date(2026, 2, 1)).days[0].key, "2026-02-02");
});

test("饮料选择可恢复，旧数据和未知饮料默认使用茶", () => {
  const legacy = { ...INITIAL_STATE };
  delete legacy.beverage;
  assert.equal(restoreHydration(JSON.stringify(legacy)).beverage, "tea");
  for (const beverage of ["tea", "coffee", "juice"]) {
    assert.equal(
      restoreHydration(JSON.stringify({ ...legacy, beverage })).beverage,
      beverage,
    );
  }
  assert.equal(
    restoreHydration(JSON.stringify({ ...legacy, beverage: "unknown" })).beverage,
    "tea",
  );
});

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
test("叶帽装扮保存后可恢复，未知装扮回退为橘子", () => {
  const saved = JSON.stringify({ ...INITIAL_STATE, accessory: "leaf" });
  assert.equal(restoreHydration(saved).accessory, "leaf");
  assert.equal(restoreHydration(JSON.stringify({ ...INITIAL_STATE, accessory: "unknown" })).accessory, "orange");
});

test("互动特效可恢复，旧数据和未知特效使用爱心", () => {
  const legacy = { ...INITIAL_STATE };
  delete legacy.effect;
  assert.equal(restoreHydration(JSON.stringify(legacy)).effect, "hearts");
  for (const effect of ["hearts", "stars", "petals"]) {
    const restored = restoreHydration(JSON.stringify({ ...legacy, effect }));
    assert.equal(restored.effect, effect);
  }
  assert.equal(
    restoreHydration(JSON.stringify({ ...legacy, effect: "unknown" })).effect,
    "hearts",
  );
});

test("四周按本地日期分为四组七天，日均包含未记录日，排除范围外记录", () => {
  const now = new Date(2027, 0, 3, 12);
  const first = new Date(2026, 11, 7, 23, 59);
  const entries = [createEntry(700, first), createEntry(1400, new Date(2026, 11, 14, 0)), createEntry(350, now), createEntry(500, new Date(2026, 11, 6)), createEntry(500, new Date(2027, 0, 4))];
  const weeks = weeklyWaterGarden(entries, now);
  assert.equal(weeks.length, 4);
  assert.ok(weeks.every((week) => week.days.length === 7));
  assert.equal(new Set(weeks.flatMap((week) => week.days.map((day) => day.key))).size, 28);
  assert.equal(weeks[0].days[0].key, "2026-12-07");
  assert.equal(weeks[3].days[6].key, "2027-01-03");
  assert.deepEqual(weeks.map((week) => week.average), [100, 200, 0, 50]);
  assert.deepEqual(weeks.map((week) => week.recordedDays), [1, 1, 0, 1]);
  assert.ok(weeklyWaterGarden([], now).every((week) => week.average === 0 && week.recordedDays === 0));
});
