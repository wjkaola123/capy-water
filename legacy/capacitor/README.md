# 小满市集

一个简单的生鲜购物车演示 App，使用 Vite、原生 JavaScript 和 Capacitor，可在浏览器运行，也包含 iOS 原生工程。

## 本地运行

```sh
npm ci
npm run dev -- --port 5173
```

打开 http://127.0.0.1:5173/ 。

## 在 iPhone 上体验（无需 Mac）

```sh
npm run phone
```

手机和电脑连接同一 Wi-Fi，在 iPhone Safari 中输入电脑的局域网地址和端口，例如 `http://192.168.0.107:5173/`。电脑 IP 可能变化，请以启动日志中的 Network 地址为准。

Safari 的共享菜单可选择“添加到主屏幕”。这是网页版本，电脑及预览服务需要保持运行；尚未提供离线缓存。若手机打不开，先检查同一 Wi-Fi、访客网络隔离或 Windows 防火墙提示。

## 构建

```sh
npm run build
```

产物在 `dist/`。商品与订单均为演示数据，结算不扣款、不提交真实订单。购物车保存在本机浏览器 localStorage，最近一次演示订单仅在页面会话中保留。

## iOS

已生成 `ios/App/App.xcodeproj`，并同步构建后的网页资源。

在安装 Xcode 和 iOS Simulator 的 macOS 上运行：

```sh
npm ci
npm run ios:sync
npm run ios:open
```

在 Xcode 选择 iPhone 模拟器并运行。Windows 上已完成网页构建和 iOS 工程生成，尚未完成原生编译或 iOS Simulator 测试。

## 已完成的浏览器测试

在内置浏览器的 390 × 844 视口中手动操作验证：

- 商品分类、名称搜索和无结果提示。
- 加入购物车、增减数量、移除商品。
- 刷新后保留购物车。
- 1 份甜橙：商品 ¥19.90 + 配送 ¥6.00 = ¥25.90。
- 3 份甜橙：商品 ¥59.70，达到 ¥59 免配送费。
- 减至 2 份：商品 ¥39.80 + 配送 ¥6.00 = ¥45.80。
- 模拟结算显示订单明细并清空购物车。

以上属于 Chromium 手机尺寸预览验证，不代表 iOS WebKit 或原生模拟器验证。
