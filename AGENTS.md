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

纯 JS：无 TypeScript / ESLint / Prettier 配置。改动后至少跑 `npm test`。

## 预览与验收

- UI 改动在浏览器分别验收 390×844 手机布局和 1440×1000 桌面布局。手机用 `npm run web`，开发页固定在手机布局。桌面用 `npm run build` 后静态托管 `dist/`，确认出现侧边导航。
- 本地 Web 默认打开 `http://localhost:5173/?previewMotion=1`，动画改动需触发交互并观察实际播放。参数仅在开发版 Web 中覆盖系统减少动态设置。桌面构建和真机仍遵循 `AccessibilityInfo`。
- Expo Go 若显示旧界面，先确认手机连接的是本项目 Metro，再重载并核对改动处。验收结果按实际执行的构建、浏览器检查和真机交互分别记录。

## 架构边界

- `App.js` —— 四个页面、交互、表单、动画集中于此（刻意保持的单一大文件）。
- `src/hydration.js` —— 领域规则、本地日期、校验、提醒时刻。**禁止引入 react-native**：测试由 Node 直接 import 此文件。
- `src/useHydration.js` —— AsyncStorage 恢复与持久化。写入走串行 promise 队列；**读取失败不得覆盖旧数据**；保存失败须提供重试入口。
- `src/reminders.native.js` / `src/reminders.web.js` —— 平台隔离。`App.js` 只写 `import ... from "./src/reminders"`，由 Metro 按 `.native.js` / `.web.js` 后缀解析。Web 端仅前台站内提醒，无系统通知。
- `src/CapyScene.js` —— 卡皮角色与温泉场景 SVG；主插画与头像共用角色组件。改饮料杯时复用 `Cup` 和 `cupGeometry`，检查饮料选择卡、池边和手持动画三处。卡片按杯身中心对齐标签，动画检查握杯位置和吸管对嘴。
- 改动物路线、计时或暂停恢复时，查 `src/turtleMotion.js`、`src/ladybugMotion.js` 和对应的 `tests/*-motion.test.js`。乌龟路线用固定种子测相邻两趟的转弯与远近差异、活动边界和回窝，再在手机布局里观察实际移动。
- `src/styles.js` —— 配色与样式。调色板定义在 `docs/design.md`，勿随手段色。
- `legacy/`（capacitor、market-expo）—— 历史版本归档，只读，勿复用其中代码。
- `assets/icon.svg` 为图标可编辑源文件；`dist/`、`test-results/`、`.expo/` 为产物目录（已 gitignore）。

## 领域规则（测试会盯）

- 水量仅接受 50–1500 整数；目标 500–5000 ml，默认 2000。
- 按**本地日期**分组（`dayKey`），跨午夜 / 跨月不得混入前一天。
- 改水分花园统计时，查 `src/hydration.js` 与 `tests/hydration.test.js`。`weeklyWaterGarden` 将最近 28 个本地日期切成四组，每组总量除以 7 得到日均。`waterGardenData` 的日均按有记录天数计算。
- 新用户数据为空，不混入演示记录；存储 key `@capy-water/v1`，状态带 `version` 字段，恢复时拒绝损坏格式。
- 提醒：先安排新通知，再清理本 App 旧计划（identifier 前缀 `capy-water-`）；仅在用户保存开启状态时请求系统权限；休息时段不提醒。通知送达尚未在 iOS / Android 真机验证。

## 约定

- 用户可见文案一律中文，语气温柔不施压：达标后提示按口渴感喝水，断开记录不惩罚。
- 保留操作标签、选中状态、键盘表单与系统减少动态支持。改场景裁剪或可聚焦控件时，在 Web 上按 Tab 检查焦点移动后插画仍在原位；仅裁剪的场景容器沿用 Web `overflow: "clip"`、原生 `overflow: "hidden"`。
- 动画：原生平台优先 native driver，Web 用 JS driver。
- import 扩展名：Metro 应用代码不带扩展名（如 `./hydration`）；Node 测试与 scripts 必须带 `.js` 扩展名，内置模块用 `node:` 前缀。
- 开发机为 Windows；8081 被占用先确认是否已有本项目 Metro 在跑，可直接复用。
