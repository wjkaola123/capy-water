import test from "node:test";
import assert from "node:assert/strict";
import { createTurtleRoute, turtleMotion, turtleFootPose, scheduleTurtleTrips, createTurtleTrip, TURTLE_TRIP_MS } from "../src/turtleMotion.js";

test("路线跨过池前中部并覆盖左右空地，经过麻雀时从后方绕行", () => {
  let seed = 639;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  let previous = null, rightmost = 0, leftmost = 0;
  for (let run = 0; run < 100; run++) {
    const route = createTurtleRoute(random, previous);
    const right = Math.max(...route.points.map(point => point.x));
    const left = Math.min(...route.points.map(point => point.x));
    assert.ok(right >= 260, "不能在旧的中部边界折返");
    assert.ok(left <= -35, "回程也可探索窝点左侧的空地");
    for (const point of route.points) {
      // 乌龟脚底初始位于场景 (154.5, 417)，右侧两只麻雀在 y≈420。
      if (point.x >= 240) assert.ok(point.y <= -28, "从麻雀后方的空地通过");
    }
    rightmost = Math.max(rightmost, right);
    leftmost = Math.min(leftmost, left);
    previous = route;
  }
  assert.ok(rightmost > 345 && leftmost < -70, "随机路线可到达两侧而非挤在中央");
});

test("随机规划改变途经点和弯向，相邻两趟远近有明显区别", () => {
  let seed = 1729;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  let previous = null, variedTurns = 0;
  for (let run = 0; run < 100; run++) {
    const route = createTurtleRoute(random, previous);
    if (route.points.some((p, i) => i && p.angle - route.points[i - 1].angle < -.002)) variedTurns++;
    if (previous) assert.ok(Math.abs(Math.max(...route.points.map(p => p.x)) - Math.max(...previous.points.map(p => p.x))) >= 25);
    previous = route;
  }
  assert.ok(variedTurns >= 70, "不能只是缩放同一个椭圆");
});

test("随机闭合路线始终留在池前，位置和朝向连续并准确回窝", () => {
  let seed = 1729;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  const shapes = new Set();
  const sources = [() => 0, () => .5, () => 1 - Number.EPSILON, ...Array(100).fill(random)];
  for (const source of sources) {
    const route = createTurtleRoute(source);
    // 不同形状也可能恰好等长，比较沿途位置而非四舍五入后的总路程。
    shapes.add(JSON.stringify(Array.from({ length: 16 }, (_, index) => {
      const point = turtleMotion(index / 16, route);
      return [point.x.toFixed(3), point.y.toFixed(3)];
    })));
    const first = turtleMotion(0, route), last = turtleMotion(1, route);
    assert.equal(first.x, 0); assert.equal(first.y, 0);
    assert.ok(Math.hypot(last.x, last.y) < 1e-10);
    assert.ok(Math.abs(last.angle - first.angle - 2 * Math.PI) < 1e-10);
    let previous = first;
    for (let step = 1; step <= 1000; step++) {
      const point = turtleMotion(step / 1000, route);
      assert.ok(point.x >= -85 && point.x <= 360 && point.y >= -34 && point.y <= 12);
      // 多个途经点会增加总路程；用实际耗时约束速度，而非固定进度的位移。
      assert.ok(Math.hypot(point.x - previous.x, point.y - previous.y) / (route.duration / 1000000) < 10);
      assert.ok(Math.abs(point.angle - previous.angle) < .25);
      // 朝向始终跟随路径切线，不能侧滑或倒着走。
      const dx = point.x - previous.x, dy = point.y - previous.y;
      const heading = (point.angle + previous.angle) / 2;
      assert.ok(dx * Math.cos(heading) + dy * Math.sin(heading) >= -1e-8);
      previous = point;
    }
    const starting = turtleMotion(100 / route.duration, route);
    assert.ok(Math.hypot(starting.x, starting.y) < .01, "起步的前100毫秒应缓慢移动");
  }
  assert.equal(shapes.size, sources.length);
});

test("随机路线按路程决定耗时，缩壳恢复保留本趟时长", () => {
  const route = createTurtleRoute(() => .8);
  const moves = [];
  const trip = createTurtleTrip({ duration: route.duration, move: (from, duration) => moves.push({ from, duration }), stop: (save) => save(.4), onWalking: () => {}, onComplete: () => {} });
  assert.equal(moves[0].duration, route.duration);
  trip.pause(); trip.resume();
  assert.equal(moves[1].from, .4);
  assert.equal(moves[1].duration, route.duration * .6);
  trip.dispose();
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
