import test from "node:test";
import assert from "node:assert/strict";
import { turtleMotion, turtleFootPose, scheduleTurtleTrips, createTurtleTrip, TURTLE_TRIP_MS } from "../src/turtleMotion.js";

test("小乌龟沿弧线持续掉头，返程错开并回到起点", () => {
  const at = (seconds) => turtleMotion(seconds * 1000 / TURTLE_TRIP_MS);
  assert.equal(at(0).x, 0);
  assert.ok(at(22).x > at(20).x);
  assert.equal(at(22).angle, Math.PI / 2);
  assert.ok(at(24).y > at(0).y);
  assert.ok(at(34).x < at(24).x);
  assert.ok(Math.abs(at(48).x) < 1e-10);
  assert.ok(Math.abs(at(48).y) < 1e-10);
  for (const join of [20, 24, 44]) {
    const before = at(join - .001), after = at(join + .001);
    assert.ok(Math.hypot(after.x - before.x, after.y - before.y) < .02);
    assert.ok(Math.abs(after.angle - before.angle) < .002);
    const leftSpeed = Math.hypot(at(join).x - before.x, at(join).y - before.y) / .001;
    const rightSpeed = Math.hypot(after.x - at(join).x, after.y - at(join).y) / .001;
    assert.ok(Math.abs(leftSpeed - rightSpeed) < .01);
  }
});

test("乌龟首次出发和返回后随机休息，单次往返结束前不重复出发", () => {
  const pending = new Map();
  const delays = [];
  let timerId = 0, starts = 0, finish, stopped = false;
  const randoms = [0, .5, .99];
  const dispose = scheduleTurtleTrips({
    random: () => randoms.shift(),
    setTimer: (callback, delay) => { delays.push(delay); pending.set(++timerId, callback); return timerId; },
    clearTimer: (id) => pending.delete(id),
    startTrip: (done) => { starts++; finish = done; return () => { stopped = true; done(false); }; },
  });
  const fire = () => { const [id, callback] = pending.entries().next().value; pending.delete(id); callback(); };
  assert.equal(starts, 0);
  assert.deepEqual(delays, [18000]);
  fire();
  assert.equal(starts, 1);
  assert.equal(pending.size, 0);
  finish(true);
  assert.deepEqual(delays, [18000, 31500]);
  assert.equal(starts, 1);
  fire();
  finish(true);
  assert.deepEqual(delays, [18000, 31500, 44730]);
  fire();
  dispose();
  assert.equal(stopped, true);
  assert.equal(pending.size, 0);
});

test("离开页面时取消乌龟的等待，不启动后续爬行", () => {
  let cleared;
  const dispose = scheduleTurtleTrips({ startTrip: () => assert.fail("不应出发"), setTimer: () => 42, clearTimer: (id) => { cleared = id; } });
  dispose();
  assert.equal(cleared, 42);
});

test("四足按对角线交替支撑与抬脚，转弯时内侧步幅缩小", () => {
  for (const cycle of [0, .1, .25, .4, .7]) {
    assert.deepEqual(turtleFootPose(cycle, 1, 1, false), turtleFootPose(cycle, -1, -1, false));
    assert.deepEqual(turtleFootPose(cycle, 1, -1, false), turtleFootPose(cycle, -1, 1, false));
  }
  assert.equal(turtleFootPose(.25, 1, 1, false).lift, 0);
  assert.equal(turtleFootPose(.25, 1, -1, false).lift, 4);
  assert.ok(turtleFootPose(0, 1, 1, true).offset < turtleFootPose(0, -1, -1, true).offset);
});

test("移动中缩壳暂停，确认安全后从原进度继续，暂停不结束行程", () => {
  const moves = [], walking = [], completions = [];
  let position = .37, stops = 0;
  const trip = createTurtleTrip({
    move: (from, duration, done) => moves.push({ from, duration, done }),
    stop: (save) => { stops++; save(position); moves.at(-1)?.done(false); },
    onWalking: (value) => walking.push(value),
    onComplete: (value) => completions.push(value),
  });
  assert.equal(moves.length, 1);
  trip.pause();
  trip.pause();
  assert.equal(stops, 1);
  assert.deepEqual(walking, [true, false]);
  moves[0].done(true); // 原动画的迟到回调不能把暂停误判为完成。
  assert.equal(completions.length, 0);
  trip.resume();
  assert.equal(moves[1].from, .37);
  assert.equal(moves[1].duration, .63 * TURTLE_TRIP_MS);
  position = .61;
  trip.pause();
  trip.resume();
  assert.equal(moves[2].from, .61);
  moves[2].done(true);
  assert.deepEqual(completions, [true]);
  trip.resume();
  assert.equal(moves.length, 3);
});

test("休息时缩壳，即使随机出发时间到了也须等确认安全后才出发", () => {
  const moves = [];
  const trip = createTurtleTrip({ initiallyHeld: true, move: (...args) => moves.push(args), stop: (save) => save(0), onWalking: () => {}, onComplete: () => {} });
  assert.equal(moves.length, 0);
  trip.resume();
  assert.equal(moves.length, 1);
  assert.equal(moves[0][0], 0);
  trip.pause();
  trip.dispose();
  trip.resume();
  assert.equal(moves.length, 1);
});
