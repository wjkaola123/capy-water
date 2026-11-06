import './style.css';

const products = [
  { id: 'orange', name: '阳光甜橙', note: '皮薄多汁，满口清甜', unit: '4 个装', price: 1990, category: '水果', color: '#fff0d6', art: '🍊', tag: '当季鲜选' },
  { id: 'avocado', name: '奶油牛油果', note: '绵密好口感，早餐好搭档', unit: '2 个装', price: 2490, category: '水果', color: '#eaf0d9', art: '🥑', tag: '人气推荐' },
  { id: 'strawberry', name: '红颜草莓', note: '一颗一口的春日甜', unit: '250 g', price: 2990, category: '水果', color: '#fbe5e6', art: '🍓', tag: '今日上新' },
  { id: 'broccoli', name: '田园西兰花', note: '清脆鲜嫩，轻食必备', unit: '约 400 g', price: 1290, category: '蔬菜', color: '#e6efe3', art: '🥦', tag: '' },
  { id: 'bread', name: '手作可颂', note: '层层酥香，慢慢享用', unit: '2 只装', price: 1890, category: '烘焙', color: '#f4e8d5', art: '🥐', tag: '每日烘焙' },
  { id: 'milk', name: '牧场鲜牛奶', note: '简单纯粹的自然奶香', unit: '950 ml', price: 1690, category: '乳品', color: '#e5edf4', art: '🥛', tag: '' },
];
const money = n => (n / 100).toFixed(2);
const icons = {
  bag: '<path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  home: '<path d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7"/>',
  leaf: '<path d="M20 4C8 2 2 8 5 15s15 4 15-11Z"/><path d="m4 21 11-12"/>',
  receipt: '<path d="M6 3v18l3-2 3 2 3-2 3 2V3l-3 2-3-2-3 2-3-2Z"/><path d="M9 9h6M9 13h6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
let page = 'shop', category = '全部', query = '', lastOrder = null;
let cart = {};
try {
  const saved = JSON.parse(localStorage.getItem('little-market-cart') || '{}');
  products.forEach(p => { if (Number.isInteger(saved[p.id]) && saved[p.id] > 0) cart[p.id] = Math.min(saved[p.id], 99); });
} catch { /* Invalid or unavailable browser storage starts a fresh cart. */ }
const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
const subtotal = () => products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0);
const shipping = () => subtotal() === 0 || subtotal() >= 5900 ? 0 : 600;
function save() { try { localStorage.setItem('little-market-cart', JSON.stringify(cart)); } catch { toast('当前浏览器无法保存购物车，关闭页面后将丢失'); } }
function toast(message) {
  const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2000);
}
function stepper(p) {
  return `<div class="stepper"><button data-action="minus" data-id="${p.id}" aria-label="减少${p.name}">−</button><span aria-label="${p.name}数量">${cart[p.id] || 0}</span><button data-action="add" data-id="${p.id}" aria-label="增加${p.name}" ${cart[p.id] >= 99 ? 'disabled' : ''}>+</button></div>`;
}
function product(p) {
  return `<article class="product"><div class="product-art" style="--fruit-bg:${p.color}">${p.tag ? `<span class="tag">${p.tag}</span>` : ''}<span class="fruit" role="img" aria-label="${p.name}">${p.art}</span><span class="art-shadow"></span></div><div class="product-info"><h3>${p.name}</h3><p>${p.note}</p><div class="product-bottom"><div><strong>¥${money(p.price)}</strong><small> / ${p.unit}</small></div>${cart[p.id] ? stepper(p) : `<button class="add" data-action="add" data-id="${p.id}" aria-label="加入${p.name}">+</button>`}</div></div></article>`;
}
function shop() {
  return `<section class="hero"><div class="hero-copy"><span class="season">好好吃饭，好好生活</span><h1>把新鲜，<br>装进日常。</h1><p>从一颗甜橙开始的小确幸。</p><button class="hero-button" data-action="seasonal">逛逛当季鲜选 ${icon('arrow')}</button></div><div class="hero-art" aria-hidden="true"><span class="orbit"></span><span class="hero-leaf leaf-one"></span><span class="hero-leaf leaf-two"></span><span class="orange whole"></span><span class="orange sliced"></span><span class="fresh-stamp">自然成熟<br><b>100%</b><br>新鲜滋味</span></div></section><div class="benefits"><span>${icon('leaf')} 每日鲜选</span><span>${icon('check')} 满 ¥59 包配送</span><span>${icon('bag')} 简单好食材</span></div><section class="catalog" aria-labelledby="catalog-title"><div class="section-title"><div><span class="eyebrow">为今天的餐桌</span><h2 id="catalog-title">挑一点喜欢的</h2></div><span class="muted">${products.length} 款好物</span></div><label class="search">${icon('search')}<input id="search" type="search" placeholder="搜索今天想吃的…" aria-label="搜索商品" value=""></label><div class="categories" role="group" aria-label="商品分类">${['全部', '水果', '蔬菜', '烘焙', '乳品'].map(c => `<button data-action="category" data-category="${c}" aria-pressed="${category === c}" class="${category === c ? 'active' : ''}">${c}</button>`).join('')}</div><div class="product-grid" id="products"></div><p class="end-note">每一口新鲜，都值得认真挑选 ${icon('leaf')}</p></section>`;
}
function cartPage() {
  const items = products.filter(p => cart[p.id]);
  return `<section class="cart-page"><div class="section-title"><div><span class="eyebrow">装下生活的小美好</span><h1>我的购物车 <small>${count()}</small></h1></div>${items.length ? '<button class="text-button" data-action="clear">清空</button>' : ''}</div>${items.length ? `<div class="delivery-note">${icon('bag')} ${subtotal() >= 5900 ? '已享包配送，新鲜马上出发' : `再买 ¥${money(5900 - subtotal())}，即可享包配送`}</div><div class="cart-items">${items.map(p => `<article class="cart-item"><div class="cart-art" style="background:${p.color}" aria-hidden="true">${p.art}</div><div class="cart-info"><h3>${p.name}</h3><p>${p.unit}</p><strong>¥${money(p.price)}</strong></div><div class="cart-actions"><button class="remove" data-action="remove" data-id="${p.id}" aria-label="移除${p.name}">${icon('trash')}</button>${stepper(p)}</div></article>`).join('')}</div><div class="order-summary"><h2>订单明细</h2><div><span>商品小计</span><span data-testid="subtotal">¥${money(subtotal())}</span></div><div><span>配送费</span><span data-testid="shipping">${shipping() ? `¥${money(shipping())}` : '免配送费'}</span></div><div class="summary-total"><strong>合计</strong><strong data-testid="total">¥${money(subtotal() + shipping())}</strong></div></div><p class="demo-note">这是演示订单，结算不会产生实际扣款或配送。</p><button class="primary checkout" data-action="checkout">模拟结算 · ¥${money(subtotal() + shipping())} ${icon('arrow')}</button><button class="continue" data-action="shop">继续挑选好物</button>` : `<div class="empty"><span class="empty-art">${icon('bag')}</span><h2>购物车里，等一点新鲜</h2><p>挑几样喜欢的，为今天加点滋味。</p><button class="primary" data-action="shop">去逛逛</button></div>`}</section>`;
}
function orders() {
  return `<section class="cart-page"><span class="eyebrow">每一份新鲜，都有回响</span><h1>我的订单</h1>${lastOrder ? `<div class="success"><span class="success-icon">${icon('check')}</span><h2>演示订单已完成</h2><p>新鲜好物，已经记在清单里。</p><span class="order-id">订单编号 ${lastOrder.id}</span></div><div class="order-summary">${lastOrder.items.map(p => `<div><span>${p.name} × ${p.quantity}</span><span>¥${money(p.price * p.quantity)}</span></div>`).join('')}<div><span>配送费</span><span>¥${money(lastOrder.shipping)}</span></div><div class="summary-total"><strong>订单金额</strong><strong>¥${money(lastOrder.total)}</strong></div></div><p class="demo-note">仅模拟结算，未实际付款。演示订单在刷新后重置。</p><button class="primary checkout" data-action="shop">继续逛市集</button>` : '<div class="empty"><span class="empty-art">' + icon('receipt') + '</span><h2>还没有订单</h2><p>去挑选一些新鲜好物吧。</p><button class="primary" data-action="shop">去逛逛</button></div>'}</section>`;
}
function updateProducts() {
  const filtered = products.filter(p => (category === '全部' || category === p.category) && (p.name + p.note).includes(query.trim()));
  document.querySelector('#products').innerHTML = filtered.length ? filtered.map(product).join('') : '<div class="no-results"><h3>暂时没有找到</h3><p>试试“甜橙”或换个分类吧。</p></div>';
}
function render() {
  document.querySelector('#app').innerHTML = `<div class="app-shell"><header class="header"><button class="brand" data-action="shop" aria-label="小满市集首页"><span class="brand-icon">${icon('leaf')}</span><span>小满市集<small>一点新鲜，刚刚好</small></span></button><span class="header-note">日常里的新鲜提案</span><button class="header-cart" data-action="cart" aria-label="打开购物车">${icon('bag')}${count() ? `<span class="badge">${count()}</span>` : ''}</button></header><main>${page === 'shop' ? shop() : page === 'cart' ? cartPage() : orders()}</main><nav class="bottom-nav" aria-label="主要导航">${[['shop', 'home', '逛市集'], ['cart', 'bag', '购物车'], ['orders', 'receipt', '订单']].map(([key, glyph, label]) => `<button data-action="${key}" class="${page === key ? 'selected' : ''}" ${page === key ? 'aria-current="page"' : ''}><span class="nav-icon">${icon(glyph)}${key === 'cart' && count() ? `<span class="badge">${count()}</span>` : ''}</span><span>${label}</span></button>`).join('')}</nav></div><div id="toast" role="status" aria-live="polite"></div>`;
  if (page === 'shop') {
    document.querySelector('#search').value = query;
    updateProducts();
    document.querySelector('#search').addEventListener('input', e => { query = e.target.value; updateProducts(); });
  }
}
document.addEventListener('click', e => {
  const button = e.target.closest('button[data-action]'); if (!button) return;
  const { action, id } = button.dataset;
  if (['shop', 'cart', 'orders'].includes(action)) { page = action; render(); window.scrollTo(0, 0); return; }
  if (action === 'category' || action === 'seasonal') {
    category = action === 'seasonal' ? '水果' : button.dataset.category;
    render(); if (action === 'seasonal') document.querySelector('.catalog').scrollIntoView({ behavior: 'smooth' }); return;
  }
  if (action === 'checkout') {
    if (!count()) return;
    lastOrder = { id: `XM${Date.now().toString().slice(-9)}`, items: products.filter(p => cart[p.id]).map(p => ({ ...p, quantity: cart[p.id] })), total: subtotal() + shipping(), shipping: shipping() };
    cart = {}; save(); page = 'orders'; render(); window.scrollTo(0, 0); return;
  }
  if (action === 'clear') { cart = {}; }
  else if (action === 'add') { if (cart[id] >= 99) return; cart[id] = (cart[id] || 0) + 1; }
  else if (action === 'minus') { if (cart[id] > 1) cart[id]--; else delete cart[id]; }
  else if (action === 'remove') { delete cart[id]; }
  else return;
  const scroll = window.scrollY;
  save(); render(); window.scrollTo(0, scroll);
  if (action === 'add') toast('已加入购物车');
});
render();
