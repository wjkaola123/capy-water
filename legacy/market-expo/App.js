import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';
import { categories, changeQuantity, checkout, filterProducts, money, totals } from './src/market';
import { useMarket } from './src/useMarket';

const colors = { green: '#235b47', ink: '#233e33', paper: '#fffefa', muted: '#7d887f', line: '#e6ebe1' };
const Icon = ({ name, size = 21, color = colors.green }) => <Feather name={name} size={size} color={color} />;

function Action({ label, onPress, children, style, textStyle, disabled, testID }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} testID={testID}
    style={({ pressed }) => [styles.action, style, pressed && styles.pressed, disabled && styles.disabled]}>
    {children || <Text style={[styles.actionText, textStyle]}>{label}</Text>}
  </Pressable>;
}

function Stepper({ product, quantity, onChange }) {
  return <View style={styles.stepper}>
    <Action label={`减少${product.name}`} onPress={() => onChange(product.id, -1)} style={styles.stepButton}><Text style={styles.stepText}>−</Text></Action>
    <Text accessibilityLabel={`${product.name}数量`} style={styles.quantity}>{quantity}</Text>
    <Action label={`增加${product.name}`} onPress={() => onChange(product.id, 1)} disabled={quantity >= 99} style={styles.stepButton}><Text style={styles.stepText}>+</Text></Action>
  </View>;
}

function Empty({ icon, title, detail, onShop }) {
  return <View style={styles.empty}>
    <View style={styles.emptyIcon}><Icon name={icon} size={42} color="#65815c" /></View>
    <Text accessibilityRole="header" style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyDetail}>{detail}</Text>
    <Action label="去逛逛" onPress={onShop} style={styles.primary} textStyle={styles.primaryText} />
  </View>;
}

function PriceRow({ label, value, testID, total }) {
  return <View style={[styles.priceRow, total && styles.totalRow]}>
    <Text style={total ? styles.totalLabel : styles.summaryLabel}>{label}</Text>
    <Text testID={testID} style={total ? styles.totalPrice : styles.summaryLabel}>{value}</Text>
  </View>;
}

function Market() {
  const { state, setState, ready, storageError } = useMarket();
  const [page, setPage] = useState('shop');
  const [category, setCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  const summary = totals(state.cart);
  const columns = width >= 650 ? 3 : 2;
  const onShop = () => setPage('shop');
  const onChange = (id, delta) => setState(previous => ({ ...previous, cart: changeQuantity(previous.cart, id, delta) }));
  const remove = id => setState(previous => {
    const cart = { ...previous.cart }; delete cart[id]; return { ...previous, cart };
  });
  const clearCart = () => {
    const clear = () => setState(previous => ({ ...previous, cart: {} }));
    if (Platform.OS === 'web') clear();
    else Alert.alert('清空购物车？', '将移除购物车中的全部商品。', [{ text: '取消', style: 'cancel' }, { text: '清空', style: 'destructive', onPress: clear }]);
  };
  const completeOrder = () => {
    if (!summary.count) return;
    setState(previous => checkout(previous)); setPage('orders');
  };

  if (!ready) return <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={styles.loadingText}>正在打开小满市集…</Text></View>;

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.shell}>
      <View style={styles.header}>
        <Action label="小满市集首页" onPress={onShop} style={styles.brand}>
          <View style={styles.brandIcon}><Icon name="feather" size={25} /></View>
          <View><Text style={styles.brandName}>小满市集</Text><Text style={styles.brandNote}>一点新鲜，刚刚好</Text></View>
        </Action>
        <Action label="打开购物车" onPress={() => setPage('cart')} style={styles.headerBag}>
          <Icon name="shopping-bag" />
          {!!summary.count && <View style={styles.badge}><Text style={styles.badgeText}>{summary.count}</Text></View>}
        </Action>
      </View>
      {!!storageError && <Text accessibilityRole="alert" style={styles.error}>{storageError}</Text>}
      <ScrollView key={page} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {page === 'shop' && <>
          <View style={styles.hero}>
            <View style={styles.heroArt} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.orangeLeaf} /><View style={styles.orange} /><View style={styles.orangeSlice}><Text style={styles.sliceText}>✳</Text></View>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.season}>好好吃饭，好好生活</Text>
              <Text accessibilityRole="header" style={styles.heroTitle}>把新鲜，{'\n'}装进日常。</Text>
              <Text style={styles.heroNote}>从一颗甜橙开始的小确幸。</Text>
              <Action label="逛逛当季鲜选" onPress={() => { setCategory('水果'); setQuery(''); }} style={styles.heroLink}>
                <Text style={styles.heroLinkText}>逛逛当季鲜选</Text><Icon name="chevron-right" size={14} />
              </Action>
            </View>
          </View>
          <View style={styles.benefits}>
            {[['feather', '每日鲜选'], ['check', '满 ¥59 包配送'], ['shopping-bag', '简单好食材']].map(([name, text]) => <View key={name} style={styles.benefit}><Icon name={name} size={13} color="#6a786c" /><Text style={styles.benefitText}>{text}</Text></View>)}
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeading}><View><Text style={styles.eyebrow}>为今天的餐桌</Text><Text accessibilityRole="header" style={styles.title}>挑一点喜欢的</Text></View><Text style={styles.resultCount}>{filterProducts(category, query).length} 款好物</Text></View>
            <View style={styles.search}><Icon name="search" size={18} color="#7e897e" /><TextInput accessibilityLabel="搜索商品" placeholder="搜索今天想吃的…" placeholderTextColor="#939b90" value={query} onChangeText={setQuery} style={styles.searchInput} returnKeyType="search" autoCorrect={false} clearButtonMode="while-editing" /></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories} keyboardShouldPersistTaps="handled">
              {categories.map(c => <Action key={c} label={c} onPress={() => setCategory(c)} style={[styles.category, c === category && styles.activeCategory]} textStyle={[styles.categoryText, c === category && styles.activeCategoryText]} />)}
            </ScrollView>
            <View style={styles.grid}>
              {filterProducts(category, query).map(p => <View key={p.id} style={[styles.product, { width: columns === 3 ? '31.8%' : '47.8%' }]}>
                <View style={[styles.productArt, { backgroundColor: p.color }]}>
                  {!!p.tag && <Text style={styles.tag}>{p.tag}</Text>}<Text style={styles.fruit} accessibilityLabel={p.name}>{p.art}</Text>
                </View>
                <Text accessibilityRole="header" style={styles.productName}>{p.name}</Text><Text style={styles.productNote}>{p.note}</Text>
                <View style={styles.productBottom}><Text><Text style={styles.productPrice}>¥{money(p.price)}</Text><Text style={styles.productUnit}> / {p.unit}</Text></Text>
                  {state.cart[p.id] ? <Stepper product={p} quantity={state.cart[p.id]} onChange={onChange} /> : <Action label={`加入${p.name}`} onPress={() => onChange(p.id, 1)} style={styles.add}><Text style={styles.addText}>+</Text></Action>}
                </View>
              </View>)}
            </View>
            {!filterProducts(category, query).length && <View style={styles.noResults}><Text style={styles.emptyTitle}>暂时没有找到</Text><Text style={styles.emptyDetail}>试试“甜橙”或换个分类吧。</Text></View>}
            <Text style={styles.endNote}>每一口新鲜，都值得认真挑选 ❧</Text>
          </View>
        </>}
        {page === 'cart' && <View style={styles.section}>
          <View style={styles.pageHeading}><View><Text style={styles.eyebrow}>装下生活的小美好</Text><Text accessibilityRole="header" style={styles.pageTitle}>我的购物车 <Text style={styles.cartCount}>{summary.count}</Text></Text></View>{!!summary.count && <Action label="清空" onPress={clearCart} textStyle={styles.subtleText} />}</View>
          {summary.count ? <>
            <View style={styles.delivery}><Icon name="shopping-bag" size={16} /><Text style={styles.deliveryText}>{summary.subtotal >= 5900 ? '已享包配送，新鲜马上出发' : `再买 ¥${money(5900 - summary.subtotal)}，即可享包配送`}</Text></View>
            {summary.items.map(p => <View key={p.id} style={styles.cartItem}>
              <View style={[styles.cartArt, { backgroundColor: p.color }]}><Text style={styles.cartFruit}>{p.art}</Text></View>
              <View style={styles.cartInfo}><Text style={styles.productName}>{p.name}</Text><Text style={styles.cartUnit}>{p.unit}</Text><Text style={styles.productPrice}>¥{money(p.price)}</Text></View>
              <View style={styles.cartActions}><Action label={`移除${p.name}`} onPress={() => remove(p.id)} style={styles.remove}><Icon name="trash-2" size={17} color="#9ca594" /></Action><Stepper product={p} quantity={p.quantity} onChange={onChange} /></View>
            </View>)}
            <View style={styles.orderSummary}><Text style={styles.summaryTitle}>订单明细</Text><PriceRow label="商品小计" value={`¥${money(summary.subtotal)}`} testID="subtotal" /><PriceRow label="配送费" value={summary.shipping ? `¥${money(summary.shipping)}` : '免配送费'} testID="shipping" /><PriceRow label="合计" value={`¥${money(summary.total)}`} testID="total" total /></View>
            <Text style={styles.demoNote}>这是演示订单，结算不会产生实际扣款或配送。</Text>
            <Action label={`模拟结算 · ¥${money(summary.total)}`} onPress={completeOrder} style={styles.primary} textStyle={styles.primaryText} />
            <Action label="继续挑选好物" onPress={onShop} style={styles.continue} textStyle={styles.subtleText} />
          </> : <Empty icon="shopping-bag" title="购物车里，等一点新鲜" detail="挑几样喜欢的，为今天加点滋味。" onShop={onShop} />}
        </View>}
        {page === 'orders' && <View style={styles.section}>
          <View style={styles.pageHeading}><View><Text style={styles.eyebrow}>每一份新鲜，都有回响</Text><Text accessibilityRole="header" style={styles.pageTitle}>我的订单</Text></View></View>
          {state.lastOrder ? <>
            <View style={styles.success}><View style={styles.successIcon}><Icon name="check" size={30} /></View><Text accessibilityRole="header" style={styles.title}>演示订单已完成</Text><Text style={styles.emptyDetail}>新鲜好物，已经记在清单里。</Text><Text style={styles.orderId}>订单编号 {state.lastOrder.id}</Text></View>
            <View style={styles.orderSummary}>{state.lastOrder.items.map(p => <PriceRow key={p.id} label={`${p.name} × ${p.quantity}`} value={`¥${money(p.price * p.quantity)}`} />)}<PriceRow label="配送费" value={`¥${money(state.lastOrder.shipping)}`} /><PriceRow label="订单金额" value={`¥${money(state.lastOrder.total)}`} total /></View>
            <Text style={styles.demoNote}>仅模拟结算，未实际付款。保留最近一笔演示订单。</Text><Action label="继续逛市集" onPress={onShop} style={styles.primary} textStyle={styles.primaryText} />
          </> : <Empty icon="file-text" title="还没有订单" detail="去挑选一些新鲜好物吧。" onShop={onShop} />}
        </View>}
      </ScrollView>
      <View style={styles.nav}>
        {[['shop', 'home', '逛市集'], ['cart', 'shopping-bag', '购物车'], ['orders', 'file-text', '订单']].map(([key, glyph, label]) => <Action key={key} label={label} onPress={() => setPage(key)} style={styles.navButton}>
          <View><Icon name={glyph} size={22} color={page === key ? colors.green : '#919a8e'} />{key === 'cart' && !!summary.count && <View style={[styles.badge, styles.navBadge]}><Text style={styles.badgeText}>{summary.count}</Text></View>}</View>
          <Text style={[styles.navLabel, page === key && styles.activeNav]}>{label}</Text>
        </Action>)}
      </View>
    </View>
    <StatusBar style="dark" backgroundColor={colors.paper} />
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><Market /></SafeAreaProvider>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper }, shell: { flex: 1, width: '100%', maxWidth: 960, alignSelf: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, gap: 15 }, loadingText: { color: colors.muted, fontSize: 13 },
  action: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, actionText: { color: colors.ink, fontSize: 13 }, pressed: { opacity: 0.65 }, disabled: { opacity: 0.35 },
  header: { height: 82, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', gap: 10 }, brandIcon: { width: 38, height: 38, borderWidth: 1, borderColor: '#235b4740', borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, brandName: { fontSize: 20, fontWeight: '700', letterSpacing: 2, color: colors.ink }, brandNote: { fontSize: 9, letterSpacing: 2, color: colors.muted, marginTop: 5 }, headerBag: { width: 44 },
  badge: { position: 'absolute', top: 2, right: 0, backgroundColor: '#e8ac51', minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, badgeText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  scroll: { flex: 1 }, content: { paddingBottom: 26 }, error: { backgroundColor: '#fff0d6', color: '#785522', padding: 12, fontSize: 12 },
  hero: { marginHorizontal: 18, minHeight: 253, backgroundColor: '#e7eedd', borderRadius: 6, overflow: 'hidden' }, heroCopy: { padding: 24, alignItems: 'flex-start' }, season: { fontSize: 10, letterSpacing: 1, color: '#5c7259' }, heroTitle: { color: colors.ink, fontSize: 35, lineHeight: 46, letterSpacing: 2, fontWeight: '400', marginVertical: 12, fontFamily: Platform.select({ ios: 'Songti SC', web: 'serif', default: undefined }) }, heroNote: { fontSize: 10, color: '#66775f' }, heroLink: { flexDirection: 'row', gap: 6, marginTop: 10, borderBottomWidth: 1, borderBottomColor: '#235b4750', minHeight: 36 }, heroLinkText: { fontSize: 10, color: colors.green },
  heroArt: { position: 'absolute', right: -7, bottom: 10, width: 190, height: 190 }, orange: { width: 125, height: 125, borderRadius: 64, backgroundColor: '#f8ac33', position: 'absolute', right: 2, top: 40, borderRightWidth: 8, borderBottomWidth: 8, borderColor: '#efa12b' }, orangeLeaf: { position: 'absolute', top: 23, right: 33, backgroundColor: '#698849', width: 65, height: 24, borderTopLeftRadius: 24, borderBottomRightRadius: 24, transform: [{ rotate: '-20deg' }] }, orangeSlice: { position: 'absolute', bottom: 0, left: 3, width: 103, height: 103, borderRadius: 52, backgroundColor: '#ffc057', borderWidth: 5, borderColor: '#fff1b7', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-15deg' }] }, sliceText: { fontSize: 91, lineHeight: 100, color: '#fff1c1', textAlign: 'center' },
  benefits: { flexDirection: 'row', justifyContent: 'space-between', margin: 20, paddingBottom: 20, borderBottomWidth: 1, borderColor: colors.line }, benefit: { flexDirection: 'row', alignItems: 'center', gap: 5 }, benefitText: { color: '#6a786c', fontSize: 10 }, section: { paddingHorizontal: 20 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, eyebrow: { color: '#8a9589', fontSize: 10, letterSpacing: 2, marginBottom: 8 }, title: { color: colors.ink, fontSize: 21, fontWeight: '600', letterSpacing: 1 }, resultCount: { fontSize: 11, color: colors.muted },
  search: { backgroundColor: '#f1f3ed', borderRadius: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46 }, searchInput: { flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 12, minHeight: 46 }, categories: { gap: 8, paddingVertical: 16 }, category: { paddingHorizontal: 17, borderRadius: 24, backgroundColor: '#f2f3ed' }, categoryText: { fontSize: 12, color: colors.ink }, activeCategory: { backgroundColor: colors.green }, activeCategoryText: { color: 'white' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 24 }, product: { flexGrow: 0 }, productArt: { height: 148, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, tag: { position: 'absolute', top: 10, left: 10, fontSize: 9, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 3, color: '#6b765b', backgroundColor: '#ffffffb0' }, fruit: { fontSize: 77, transform: [{ rotate: '-10deg' }] }, productName: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 12 }, productNote: { fontSize: 10, color: '#8b9489', marginTop: 6, marginBottom: 10 }, productBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, minHeight: 44 }, productPrice: { fontSize: 17, fontWeight: '600', color: '#315e45', fontVariant: ['tabular-nums'] }, productUnit: { color: '#8b9489', fontSize: 10 }, add: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.green }, addText: { color: 'white', fontSize: 28, lineHeight: 32 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#dfe6db', borderRadius: 23, backgroundColor: colors.paper }, stepButton: { width: 36, minHeight: 42 }, stepText: { color: colors.green, fontSize: 22 }, quantity: { minWidth: 18, textAlign: 'center', color: colors.ink, fontSize: 12 }, endNote: { textAlign: 'center', color: '#9aa191', fontSize: 10, letterSpacing: 1, marginTop: 36 },
  pageHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 22, marginBottom: 22 }, pageTitle: { fontSize: 26, color: colors.ink, fontWeight: '600' }, cartCount: { fontSize: 16, color: '#65815c' }, subtleText: { color: colors.muted, fontSize: 12 }, delivery: { backgroundColor: '#edf2e6', borderRadius: 7, padding: 14, flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }, deliveryText: { flex: 1, fontSize: 12, color: colors.green }, cartItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.line }, cartArt: { width: 70, height: 85, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, cartFruit: { fontSize: 46 }, cartInfo: { flex: 1 }, cartUnit: { fontSize: 11, color: colors.muted, marginVertical: 10 }, cartActions: { alignItems: 'flex-end' }, remove: { width: 44, height: 44 },
  orderSummary: { marginTop: 28, backgroundColor: '#f5f6f0', padding: 20, borderRadius: 10 }, summaryTitle: { fontSize: 16, fontWeight: '600', color: colors.ink, marginBottom: 14 }, priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 9 }, summaryLabel: { color: '#778271', fontSize: 13 }, totalRow: { marginTop: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#dfe5d9' }, totalLabel: { color: colors.ink, fontWeight: '700', fontSize: 17 }, totalPrice: { color: colors.green, fontWeight: '700', fontSize: 23, fontVariant: ['tabular-nums'] }, demoNote: { fontSize: 10, lineHeight: 18, color: '#8c9586', textAlign: 'center', marginVertical: 20 }, primary: { backgroundColor: colors.green, borderRadius: 8, minHeight: 50, paddingHorizontal: 26, paddingVertical: 14 }, primaryText: { color: 'white', fontSize: 14 }, continue: { marginTop: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 }, emptyIcon: { width: 105, height: 105, backgroundColor: '#edf2e6', borderRadius: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 25 }, emptyTitle: { color: colors.ink, fontSize: 20, fontWeight: '500', textAlign: 'center' }, emptyDetail: { fontSize: 12, color: colors.muted, marginTop: 14, marginBottom: 25, textAlign: 'center', lineHeight: 20 }, noResults: { paddingVertical: 40 }, success: { alignItems: 'center', paddingTop: 25 }, successIcon: { width: 65, height: 65, borderRadius: 33, backgroundColor: '#e9f0e1', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }, orderId: { fontSize: 10, color: '#9aa191' },
  nav: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper, paddingTop: 8, paddingBottom: 8 }, navButton: { gap: 5, minWidth: 75, paddingVertical: 5 }, navLabel: { fontSize: 10, color: '#919a8e' }, activeNav: { color: colors.green, fontWeight: '700' }, navBadge: { top: -5, right: -10 },
});
