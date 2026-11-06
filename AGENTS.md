# 卡皮补水站（capy-water）

Expo SDK 58 + React Native 0.88 + React 19 的饮水记录与提醒 App。iOS / Android / Web 共用一套原生组件代码，不使用 WebView。UI 文案与测试用例均为中文；仅浅色主题；需 Node 22.13+（验证环境 Node 24）。背景资料见 `README.md` 与 `docs/design.md`。

## 命令

```powershell
npm ci                        # 安装依赖
npm start                     # Expo Go 开发服务器（局域网 :8081）
npm run web                   # Web 预览（:5173）
npm test                      # node --test tests/*.test.js（Node 内置测试器，无 Jest）
npm run build                 # expo export --platform web → dist/
npm run check && npx expo-doctor
node scripts/build-icon.js    # 从 assets/icon.svg 重新生成 icon.png
npm run qr -- <电脑IP>        # 多网卡时生成手机连接二维码
```

纯 JS：无 TypeScript / ESLint / Prettier 配置。改动后至少跑 `npm test`；UI 改动需在浏览器验证 390×844 手机与 1440×1000 桌面两种布局。

## 架构边界

- `App.js` —— 四个页面、交互、表单、动画集中于此（刻意保持的单一大文件）。
- `src/hydration.js` —— 领域规则、本地日期、校验、提醒时刻。**禁止引入 react-native**：测试由 Node 直接 import 此文件。
- `src/useHydration.js` —— AsyncStorage 恢复与持久化。写入走串行 promise 队列；**读取失败不得覆盖旧数据**；保存失败须提供重试入口。
- `src/reminders.native.js` / `src/reminders.web.js` —— 平台隔离。`App.js` 只写 `import ... from "./src/reminders"`，由 Metro 按 `.native.js` / `.web.js` 后缀解析。Web 端仅前台站内提醒，无系统通知。
- `src/CapyScene.js` —— 卡皮角色与温泉场景 SVG；主插画与头像共用角色组件。
- `src/styles.js` —— 配色与样式。调色板定义在 `docs/design.md`，勿随手段色。
- `legacy/`（capacitor、market-expo）—— 历史版本归档，只读，勿复用其中代码。
- `assets/icon.svg` 为图标可编辑源文件；`dist/`、`test-results/`、`.expo/` 为产物目录（已 gitignore）。

## 领域规则（测试会盯）

- 水量仅接受 50–1500 整数；目标 500–5000 ml，默认 2000。
- 按**本地日期**分组（`dayKey`），跨午夜 / 跨月不得混入前一天。
- 新用户数据为空，不混入演示记录；存储 key `@capy-water/v1`，状态带 `version` 字段，恢复时拒绝损坏格式。
- 提醒：先安排新通知，再清理本 App 旧计划（identifier 前缀 `capy-water-`）；仅在用户保存开启状态时请求系统权限；休息时段不提醒。通知送达尚未在 iOS / Android 真机验证。

## 约定

- 用户可见文案一律中文，语气温柔不施压：达标后提示按口渴感喝水，断开记录不惩罚。
- 保留可访问性：操作标签、选中状态、键盘表单、减少动态（`AccessibilityInfo`）与手动动画开关；`motion` 状态可全局关闭动画。
- 动画：原生平台优先 native driver，Web 用 JS driver。
- import 扩展名：Metro 应用代码不带扩展名（如 `./hydration`）；Node 测试与 scripts 必须带 `.js` 扩展名，内置模块用 `node:` 前缀。
- 开发机为 Windows；8081 被占用先确认是否已有本项目 Metro 在跑，可直接复用。
