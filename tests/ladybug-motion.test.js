import test from "node:test";
import assert from "node:assert/strict";
import { LADYBUG_ROUTE, LADYBUG_CYCLE_MS } from "../src/ladybugMotion.js";

test("瓢虫沿身体朝向前进，转身期间不会原地打转或横滑", () => {
  for (let index = 1; index < LADYBUG_ROUTE.length; index++) {
    const previous = LADYBUG_ROUTE[index - 1];
    const pose = LADYBUG_ROUTE[index];
    const dx = pose.x - previous.x;
    const dy = pose.y - previous.y;
    const heading = (pose.angle + previous.angle) / 2 * Math.PI / 180;
    const distance = Math.hypot(dx, dy);
    assert.ok(distance > .03);
    assert.ok((dx * Math.sin(heading) - dy * Math.cos(heading)) / distance > .9999);
  }
});

test("瓢虫掉头渐入渐出，半程与完整循环没有位置或速度跳变", () => {
  const first = LADYBUG_ROUTE[0];
  const last = LADYBUG_ROUTE.at(-1);
  assert.equal(last.x, first.x);
  assert.equal(last.y, first.y);
  assert.equal(last.angle - first.angle, 360);
  const dt = LADYBUG_CYCLE_MS / 1000 / (LADYBUG_ROUTE.length - 1);
  const velocities = LADYBUG_ROUTE.slice(1).map((pose, index) => {
    const previous = LADYBUG_ROUTE[index];
    const angularSpeed = (pose.angle - previous.angle) / dt;
    assert.ok(angularSpeed >= 0 && angularSpeed < 42);
    return [(pose.x - previous.x) / dt, (pose.y - previous.y) / dt, angularSpeed];
  });
  for (let index = 0; index < velocities.length; index++) {
    const next = velocities[(index + 1) % velocities.length];
    const current = velocities[index];
    assert.ok(Math.hypot(next[0] - current[0], next[1] - current[1]) < .04);
    assert.ok(Math.abs(next[2] - current[2]) < 3);
  }
});
