export const LADYBUG_CYCLE_MS = 36000;
const HALF_SAMPLES = 180;
const smooth = (t) => t * t * (3 - 2 * t);

// 半程先直走，再用 6.5 秒绕小弯；角速度在弯道两端归零。
function heading(t) {
  return 35 + 180 * smooth(Math.max(0, Math.min(1, (t - .64) / .36)));
}

// 按身体朝向积分位移，掉头时仍向前爬，避免停在原地旋转。
// 后半程与前半程中心对称，位置、速度、朝向在循环接缝处连续。
const firstHalf = [{ phase: 0, x: 0, y: 0, angle: 35 }];
for (let index = 1; index <= HALF_SAMPLES; index++) {
  const t = (index - .5) / HALF_SAMPLES;
  const angle = heading(t) * Math.PI / 180;
  const turn = Math.max(0, Math.min(1, (t - .64) / .36));
  const speed = .52 * (1 - .28 * Math.sin(Math.PI * turn) ** 2);
  const distance = speed * LADYBUG_CYCLE_MS / 2000 / HALF_SAMPLES;
  const previous = firstHalf[index - 1];
  firstHalf.push({
    phase: index / (2 * HALF_SAMPLES),
    x: previous.x + Math.sin(angle) * distance,
    y: previous.y - Math.cos(angle) * distance,
    angle: heading(index / HALF_SAMPLES),
  });
}
const end = firstHalf[HALF_SAMPLES];
export const LADYBUG_ROUTE = [
  ...firstHalf,
  ...firstHalf.slice(1).map((pose) => ({
    phase: .5 + pose.phase,
    x: end.x - pose.x,
    y: end.y - pose.y,
    angle: 180 + pose.angle,
  })),
];
