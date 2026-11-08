export const TURTLE_TRIP_MS = 48000;
const DISTANCE = 145.5;
const RADIUS = 8;
const LEG_SECONDS = 20;
const TURN_SECONDS = 4;
// 直路两端的速度接上弯道，中央略快，接近掉头处逐渐放慢。
const END_SPEED = (Math.PI * RADIUS / TURN_SECONDS) / (DISTANCE / LEG_SECONDS);
const along = (t) => t + (END_SPEED - 1) * Math.sin(2 * Math.PI * t) / (2 * Math.PI);

// 暂停只保存当前路程，不结束本趟行程，也不重新抽取出发时间。
export function createTurtleTrip({ move, stop, onWalking, onComplete, initiallyHeld = false }) {
  let held = initiallyHeld;
  let disposed = false;
  let position = 0;
  let generation = 0;
  const run = () => {
    if (held || disposed) return;
    const token = ++generation;
    onWalking(true);
    move(position, (1 - position) * TURTLE_TRIP_MS, (finished) => {
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

export function turtleMotion(progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * TURTLE_TRIP_MS / 1000;
  if (seconds < 20) return { x: DISTANCE * along(seconds / 20), y: 0, angle: 0, turning: false };
  if (seconds < 24) {
    const angle = Math.PI * (seconds - 20) / 4;
    return { x: DISTANCE + RADIUS * Math.sin(angle), y: RADIUS * (1 - Math.cos(angle)), angle, turning: true };
  }
  if (seconds < 44) return { x: DISTANCE * (1 - along((seconds - 24) / 20)), y: 2 * RADIUS, angle: Math.PI, turning: false };
  const angle = Math.PI + Math.PI * (seconds - 44) / 4;
  return { x: RADIUS * Math.sin(angle), y: RADIUS * (1 - Math.cos(angle)), angle, turning: true };
}
