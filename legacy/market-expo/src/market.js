export const products = [
  { id: 'orange', name: '阳光甜橙', note: '皮薄多汁，满口清甜', unit: '4 个装', price: 1990, category: '水果', color: '#fff0d6', art: '🍊', tag: '当季鲜选' },
  { id: 'avocado', name: '奶油牛油果', note: '绵密好口感，早餐好搭档', unit: '2 个装', price: 2490, category: '水果', color: '#eaf0d9', art: '🥑', tag: '人气推荐' },
  { id: 'strawberry', name: '红颜草莓', note: '一颗一口的春日甜', unit: '250 g', price: 2990, category: '水果', color: '#fbe5e6', art: '🍓', tag: '今日上新' },
  { id: 'broccoli', name: '田园西兰花', note: '清脆鲜嫩，轻食必备', unit: '约 400 g', price: 1290, category: '蔬菜', color: '#e6efe3', art: '🥦', tag: '' },
  { id: 'bread', name: '手作可颂', note: '层层酥香，慢慢享用', unit: '2 只装', price: 1890, category: '烘焙', color: '#f4e8d5', art: '🥐', tag: '每日烘焙' },
  { id: 'milk', name: '牧场鲜牛奶', note: '简单纯粹的自然奶香', unit: '950 ml', price: 1690, category: '乳品', color: '#e5edf4', art: '🥛', tag: '' },
];
export const categories = ['全部', '水果', '蔬菜', '烘焙', '乳品'];
export const money = cents => (cents / 100).toFixed(2);
export const EMPTY_STATE = { cart: {}, lastOrder: null };
export const STORAGE_KEY = 'little-market-state-v2';

export function sanitizeCart(value) {
  const cart = {};
  if (!value || typeof value !== 'object') return cart;
  for (const p of products) {
    if (Number.isInteger(value[p.id]) && value[p.id] > 0) cart[p.id] = Math.min(value[p.id], 99);
  }
  return cart;
}

export function totals(cart) {
  const items = products.filter(p => cart[p.id]).map(p => ({ ...p, quantity: cart[p.id] }));
  const count = items.reduce((sum, p) => sum + p.quantity, 0);
  const subtotal = items.reduce((sum, p) => sum + p.quantity * p.price, 0);
  const shipping = subtotal > 0 && subtotal < 5900 ? 600 : 0;
  return { items, count, subtotal, shipping, total: subtotal + shipping };
}

export function changeQuantity(cart, id, delta) {
  if (!products.some(p => p.id === id)) return cart;
  const next = { ...cart };
  const quantity = Math.min(99, Math.max(0, (next[id] || 0) + delta));
  if (quantity) next[id] = quantity;
  else delete next[id];
  return next;
}

export function checkout(state, timestamp = Date.now()) {
  const summary = totals(state.cart);
  if (!summary.count) return state;
  return { cart: {}, lastOrder: { ...summary, id: `XM${timestamp}`, createdAt: timestamp } };
}

export function restoreState(serialized) {
  const saved = JSON.parse(serialized || '{}');
  const cart = sanitizeCart(saved?.cart);
  const order = saved?.lastOrder;
  let lastOrder = null;
  if (typeof order?.id === 'string' && Number.isFinite(order.createdAt) && Array.isArray(order.items)) {
    // Recompute persisted demo totals rather than trusting stored prices.
    const orderCart = sanitizeCart(Object.fromEntries(order.items.map(p => [p?.id, p?.quantity])));
    if (Object.keys(orderCart).length) lastOrder = { ...totals(orderCart), id: order.id, createdAt: order.createdAt };
  }
  return { cart, lastOrder };
}

export function filterProducts(category, query) {
  const needle = query.trim();
  return products.filter(p => (category === '全部' || category === p.category) && (p.name + p.note).includes(needle));
}
