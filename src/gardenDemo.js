// 固定种子让预览可重复；所有记录仅供视图展示，不写入用户存储。
export function createGardenDemo(now = new Date()) {
  let seed = 73129;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const entries = [];
  for (let offset = 89; offset >= 0; offset--) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    // 留白、连续休息、小口记录、日常水量和较高水量都在各区间出现。
    let total = offset % 17 <= 2 || random() < 0.12 ? 0
      : offset % 11 === 0 ? 50
      : offset % 9 === 0 ? 4000 + Math.floor(random() * 11) * 50
      : offset % 7 === 0 ? 150 + Math.floor(random() * 6) * 50
      : 1000 + Math.floor(random() * 35) * 50;
    if (offset === 0) total = 750;
    if (offset === 1) total = 2300;
    if (offset === 2) total = 0;
    if (offset === 3) total = 4500;
    if (offset === 4) total = 50;
    if (offset === 5) total = 1800;
    if (offset === 6) total = 0;
    let index = 0;
    while (total > 0) {
      const amount = Math.min(total, (3 + Math.floor(random() * 10)) * 50);
      const at = new Date(date);
      if (offset === 0) {
        // 今天的演示不生成当前时刻之后的记录。
        const elapsed = Math.floor(random() * (now.getHours() * 60 + now.getMinutes() + 1));
        at.setHours(Math.floor(elapsed / 60), elapsed % 60, 0, 0);
      } else {
        at.setHours(6 + Math.floor(random() * 18), Math.floor(random() * 60), 0, 0);
      }
      entries.push({ id: `garden-demo-${date.getTime()}-${index++}`, amount, at: at.toISOString() });
      total -= amount;
    }
  }
  return entries;
}
