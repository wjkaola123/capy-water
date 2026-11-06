# 小满市集 · Expo Go

当前主项目已从 Vite + Capacitor 改写为 Expo + React Native。页面直接使用 View、Text、Pressable、TextInput 和 ScrollView；没有通过 WebView 加载旧网页。

## 在 iPhone Expo Go 中运行

1. 安装 Expo Go。当前项目使用 SDK 58，已按用户 iPhone 上 Expo Go 报告的 SDK 58.0.0 进行匹配。若以后提示 SDK 不兼容，请先核对手机 Expo Go 支持的 SDK，再匹配升级项目。
2. 在电脑终端运行：

```powershell
cd C:\project\testapp
npm ci
npx expo login
npm start
```

3. 在 iPhone 的 Expo Go 中登录与电脑相同的 Expo 账号。当前官方文档要求 iOS 真机两端账号一致。不要把密码发到聊天中。
4. 手机与电脑连接同一 Wi-Fi，用 iPhone 相机扫描终端二维码，选择在 Expo Go 打开。Metro 默认端口为 8081。
5. 编辑 App.js 或 src 下的文件，保存后会触发 Fast Refresh。

当前准备的开发地址为 `exp://192.168.0.107:8081`。IP 会随网络变化，以终端显示的地址为准。项目在未登录状态下也能启动开发服务器，但 iPhone Expo Go 的账号校验需要完成上述登录步骤。登录后重启开发服务器再扫码。

如需单独生成二维码图片：

```powershell
npm run qr
# 多个网卡时手动指定当前 Wi-Fi 地址：
npm run qr -- 192.168.0.107
```

图片位于 test-results/expo-go.png。它编码的是电脑局域网开发地址，不包含账号密码。

如果同一 Wi-Fi 无法连接，先检查是否连接访客网络、VPN 或路由器设备隔离。也可手动使用 `npx expo start --go --tunnel`，Expo 可能提示安装 tunnel 依赖。运行期间电脑和 Metro 服务需要保持开启。

## Web 预览与检查

```powershell
npm run web           # http://localhost:5173，React Native Web，共用原生组件
npm test              # 购物车业务规则测试
npm run check         # SDK 依赖版本检查
npx expo-doctor       # 项目兼容性检查
npm run build         # 导出 Web 到 dist/
npx expo export --platform all  # 检查 iOS、Android 和 Web JS 打包
```

Web 预览使用独立的 5173 端口。Expo Go 使用 8081，不要在 Expo Go 中输入普通网页地址。

## 功能

- 6 款商品、分类筛选、搜索与无结果提示。
- 加入、减少、移除、清空购物车；单品数量上限 99。
- 商品金额以整数分计算，满 ¥59 免配送费，否则配送费 ¥6。
- AsyncStorage 保存购物车和最近一笔演示订单，应用重载后恢复。
- 模拟结算展示订单明细并清空购物车，不发生真实付款或配送。
- 兼容安全区域，底部导航不会覆盖滚动内容。

浏览器和 iPhone 分别保存本地数据；旧网页购物车不会自动转移到手机。

## 文件

- App.js：React Native 页面和组件。
- src/market.js：商品、搜索、金额、数量和订单规则。
- src/useMarket.js：异步加载和按顺序保存本地状态。
- app.json：Expo 配置。
- tests/market.test.js：业务测试。
- legacy/capacitor/：旧版网页及 Capacitor iOS 工程归档，不参与当前 Expo 运行。

## 本次验证

- SDK 58：5 项业务测试通过；Expo Doctor 20 项检查通过。
- iOS、Android、Web JavaScript bundle 导出通过。
- React Native Web 手机尺寸预览验证购物车增减、配送费、刷新恢复、搜索、分类及模拟结算。
- 尚未在用户 iPhone 中实际运行；需要用户完成 Expo 账号登录并扫码验证。
- JS bundle 导出不等同于 IPA 构建。当前任务使用 Expo Go，不生成独立安装包。

参考：[创建项目](https://docs.expo.dev/get-started/create-a-project/)、[真机运行与登录要求](https://docs.expo.dev/get-started/start-developing/)、[AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)。
