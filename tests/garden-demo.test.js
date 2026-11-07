import test from "node:test";
import assert from "node:assert/strict";
import { createGardenDemo } from "../src/gardenDemo.js";
import { waterGardenData, validAmount } from "../src/hydration.js";

test("演示数据可重复，覆盖低水量、高水量、空白和多杯，不产生未来记录", () => {
  const now = new Date(2027, 0, 2, 12, 15);
  const entries = createGardenDemo(now);
  assert.deepEqual(entries, createGardenDemo(now));
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
  assert.ok(entries.every((entry) => validAmount(entry.amount) && new Date(entry.at) <= now));
  for (const range of [7, 30, 90]) {
    const result = waterGardenData(entries, range, now);
    assert.ok(result.days.some((day) => day.amount === 0));
    assert.ok(result.days.some((day) => day.amount === 50));
    assert.ok(result.days.some((day) => day.amount >= 4000));
    assert.ok(result.days.some((day) => day.cups >= 5));
    assert.equal(result.days.at(-1).amount, 750);
  }
  assert.ok(createGardenDemo(new Date(2027, 0, 2, 0, 0)).every((entry) => new Date(entry.at) <= new Date(2027, 0, 2, 0, 0)));
});
