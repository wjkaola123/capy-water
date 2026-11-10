export const TURTLE_TRIP_MS = 48000;
// 每趟重新选途经点；控制点均在池前空地内，贝塞尔曲线不会越界。
export function createTurtleRoute(random = Math.random, previousRoute = null) {
  // 坐标相对窝点，乌龟脚底起点为 (154.5, 417)。活动区扩展到整个池前：
  // 左侧留出花草与画面边缘，右侧可走到 x≈515，不再在池中央折返。
  const minReach = 260, maxReach = 360;
  // 排除上一趟附近的折返距离，避免手机缩放后仍像同一条路。
  const previousReach = previousRoute?.reach;
  const lowerSpan = previousReach == null ? maxReach - minReach : Math.max(0, Math.min(maxReach, previousReach - 30) - minReach);
  const upperStart = previousReach == null ? maxReach : Math.max(minReach, Math.min(maxReach, previousReach + 30));
  const choice = random() * (lowerSpan + maxReach - upperStart);
  const reach = choice < lowerSpan ? minReach + choice : upperStart + choice - lowerSpan;
  const leftReach = -35 - random() * 45;
  const knots = [{ x: 0, y: 0, tx: 8, ty: 0 }];
  const outwardCount = 1 + Math.floor(random() * 3);
  const returnCount = 1 + Math.floor(random() * 3);
  for (let i = 1; i <= outwardCount; i++) {
    knots.push({ x: 180 * i / (outwardCount + 1), y: -26 + random() * 36, tx: 180 / (outwardCount + 1) * .3, ty: 0 });
  }
  // 到右侧时沿麻雀后方的窄空地通过；整段控制点都在 y=-34..-28，
  // 脚底位于 y=383..389，既不踩进池水，也不穿过麻雀。
  knots.push({ x: 200, y: -32, tx: 16, ty: 0 });
  const rightCount = 1 + Math.floor(random() * 2);
  for (let i = 1; i <= rightCount; i++) {
    knots.push({ x: 200 + (reach - 200) * i / (rightCount + 1), y: -34 + random() * 2, tx: (reach - 200) / (rightCount + 1) * .3, ty: 0 });
  }
  knots.push({ x: reach, y: -31, tx: 0, ty: 2 });
  for (let i = rightCount; i >= 1; i--) {
    knots.push({ x: 200 + (reach - 200) * i / (rightCount + 1), y: -30 + random() * 2, tx: -(reach - 200) / (rightCount + 1) * .3, ty: 0 });
  }
  knots.push({ x: 200, y: -29, tx: -16, ty: 0 });
  for (let i = returnCount; i >= 1; i--) {
    knots.push({ x: leftReach + (180 - leftReach) * i / (returnCount + 1), y: -24 + random() * 36, tx: -(180 - leftReach) / (returnCount + 1) * .3, ty: 0 });
  }
  knots.push({ x: leftReach, y: 2 + random() * 6, tx: 0, ty: -4 }, knots[0]);
  const points = [];
  let distance = 0, previousAngle = 0;
  const steps = (knots.length - 1) * 128;
  for (let index = 0; index <= steps; index++) {
    const segment = Math.min(knots.length - 2, Math.floor(index / 128));
    const t = index / 128 - segment, u = 1 - t;
    const a = knots[segment], b = knots[segment + 1];
    const c = { x: a.x + a.tx, y: a.y + a.ty };
    const d = { x: b.x - b.tx, y: b.y - b.ty };
    const x = u ** 3 * a.x + 3 * u ** 2 * t * c.x + 3 * u * t ** 2 * d.x + t ** 3 * b.x;
    const y = u ** 3 * a.y + 3 * u ** 2 * t * c.y + 3 * u * t ** 2 * d.y + t ** 3 * b.y;
    const dx = 3 * u ** 2 * (c.x - a.x) + 6 * u * t * (d.x - c.x) + 3 * t ** 2 * (b.x - d.x);
    const dy = 3 * u ** 2 * (c.y - a.y) + 6 * u * t * (d.y - c.y) + 3 * t ** 2 * (b.y - d.y);
    let angle = Math.atan2(dy, dx);
    while (angle - previousAngle < -Math.PI) angle += Math.PI * 2;
    while (angle - previousAngle > Math.PI) angle -= Math.PI * 2;
    // 急弯额外分配时间，避免窄弧端点突然甩头；直线仍保持轻缓爬行。
    if (index) distance += Math.hypot(x - points[index - 1].x, y - points[index - 1].y) + Math.abs(angle - previousAngle) * 12;
    points.push({ x, y, angle, distance });
    previousAngle = angle;
  }
  Object.assign(points.at(-1), { x: 0, y: 0, angle: Math.PI * 2 });
  return { points, distance, reach, duration: distance / 6 * 1000 };
}
const DEFAULT_ROUTE = createTurtleRoute(() => .5);

// 暂停只保存当前路程，不结束本趟行程，也不重新抽取出发时间。
export function createTurtleTrip({ move, stop, onWalking, onComplete, initiallyHeld = false, duration = TURTLE_TRIP_MS }) {
  let held = initiallyHeld;
  let disposed = false;
  let position = 0;
  let generation = 0;
  const run = () => {
    if (held || disposed) return;
    const token = ++generation;
    onWalking(true);
    move(position, (1 - position) * duration, (finished) => {
      if (!finished || disposed || held || token !== generation) return;
      disposed = true;
      onWalking(false);
      onComplete(true);
    });
  };
  const controls = {
    pause() {
      if (held || disposed) return;
      held = true;
      generation++;
      onWalking(false);
      stop((value) => { position = value; });
    },
    resume() {
      if (!held || disposed) return;
      held = false;
      run();
    },
    dispose() {
      disposed = true;
      generation++;
      stop(() => {});
    },
  };
  run();
  return controls;
}

// 首次出发和每次返回后都重新抽取等待时间，不连续绕行。
export function scheduleTurtleTrips({ startTrip, random = Math.random, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let disposed = false;
  let timer = null;
  let stopTrip = null;
  const wait = () => {
    timer = setTimer(() => {
      timer = null;
      stopTrip = startTrip((finished) => {
        stopTrip = null;
        if (!disposed && finished) wait();
      });
    }, 18000 + Math.floor(random() * 27000));
  };
  wait();
  return () => {
    disposed = true;
    if (timer !== null) clearTimer(timer);
    stopTrip?.();
  };
}

export function turtleFootPose(cycle, side, end, turning) {
  const phase = (cycle + (side * end < 0 ? .5 : 0)) % 1;
  const swing = phase >= .5;
  const progress = swing ? (phase - .5) * 2 : phase * 2;
  const reach = turning && side === 1 ? 2.5 : 4.5;
  return {
    offset: swing ? -reach + 2 * reach * progress : reach - 2 * reach * progress,
    lift: swing ? 4 * Math.sin(Math.PI * progress) : 0,
  };
}

export function turtleMotion(progress, route = DEFAULT_ROUTE) {
  const phase = Math.max(0, Math.min(1, progress));
  // 起步和回窝渐慢，中途按路程推进；暂停恢复沿用同一进度。
  const target = (.5 - .5 * Math.cos(Math.PI * phase)) * route.distance;
  const points = route.points;
  let low = 0, high = points.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (points[middle].distance < target) low = middle;
    else high = middle;
  }
  const from = points[low], to = points[high];
  const span = to.distance - from.distance;
  const fraction = span ? (target - from.distance) / span : 0;
  return {
    x: from.x + (to.x - from.x) * fraction,
    y: from.y + (to.y - from.y) * fraction,
    angle: from.angle + (to.angle - from.angle) * fraction,
    turning: span > 0 && Math.abs(to.angle - from.angle) / span > .025,
  };
}
