import test from 'node:test';
import assert from 'node:assert/strict';
import { changeQuantity, checkout, EMPTY_STATE, filterProducts, restoreState, sanitizeCart, totals } from '../src/market.js';

test('delivery fee changes correctly across the free-shipping threshold', () => {
  assert.deepEqual([totals({}).total, totals({}).shipping], [0, 0]);
  assert.deepEqual([totals({ orange: 1 }).subtotal, totals({ orange: 1 }).total], [1990, 2590]);
  assert.deepEqual([totals({ orange: 3 }).total, totals({ orange: 3 }).shipping], [5970, 0]);
  const reduced = changeQuantity({ orange: 3 }, 'orange', -1);
  assert.deepEqual([totals(reduced).total, totals(reduced).shipping], [4580, 600]);
});

test('quantity limits, removal, and unknown product IDs are handled', () => {
  assert.deepEqual(changeQuantity({ orange: 99 }, 'orange', 1), { orange: 99 });
  assert.deepEqual(changeQuantity({ orange: 1 }, 'orange', -1), {});
  assert.deepEqual(changeQuantity({}, 'missing', 1), {});
  assert.deepEqual(sanitizeCart({ orange: 1000, milk: -1, bread: 1.5, missing: 4 }), { orange: 99 });
});

test('checkout snapshots items, clears cart, and survives storage round-trip', () => {
  const initial = { ...EMPTY_STATE, cart: { orange: 2, avocado: 1 } };
  const result = checkout(initial, 12345);
  assert.deepEqual(result.cart, {});
  assert.equal(result.lastOrder.total, 6470);
  assert.equal(result.lastOrder.items[0].quantity, 2);
  assert.deepEqual(initial.cart, { orange: 2, avocado: 1 });
  assert.deepEqual(restoreState(JSON.stringify(result)), result);
  assert.equal(checkout(EMPTY_STATE), EMPTY_STATE);
});

test('storage data is validated and order totals are recalculated', () => {
  assert.deepEqual(restoreState('null'), EMPTY_STATE);
  const raw = { cart: { orange: 3, milk: '2' }, lastOrder: { id: 'demo', createdAt: 1, total: 1, items: [{ id: 'orange', quantity: 1, price: 1 }] } };
  const restored = restoreState(JSON.stringify(raw));
  assert.deepEqual(restored.cart, { orange: 3 });
  assert.equal(restored.lastOrder.total, 2590);
  assert.throws(() => restoreState('invalid JSON'));
});

test('category and search filters combine and ignore surrounding spaces', () => {
  assert.deepEqual(filterProducts('全部', ' 草莓 ').map(p => p.id), ['strawberry']);
  assert.equal(filterProducts('蔬菜', '草莓').length, 0);
  assert.equal(filterProducts('水果', '').length, 3);
});
