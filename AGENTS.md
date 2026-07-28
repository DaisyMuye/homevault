# HomeVault - Agent Notes

## Project Setup
- Expo SDK 57 project using expo-router (file-based routing)
- SQLite for local storage (expo-sqlite)
- Zustand for state management

## Changelog

### 2026-07-28 — 第二轮开发
- **重命名功能**: 房间卡片左上角 ✏️ 图标重命名；柜子/物品长按弹菜单选「重命名」。新增通用 `RenameModal` 组件。
- **拍照裁剪**: 选图后弹出裁剪界面，8 个手柄（4 角 + 4 边中点），1:1 方形裁剪。新增 `ImageCropper` 组件，集成到 add-cabinet/add-item。
- **Profile 修复**: 操作记录里「放回」按钮只在物品当前仍被拿走时才显示；每条记录右上角 × 可删除。新增 `deleteActionLog` DB/Store 方法。
- **Minecraft 像素风**: `lib/pixelProcessor.ts` (Canvas 16x16→24色→128x128) + `components/PixelProcessor.tsx` (WebView 包装)，待集成到保存流程。
- **数据库/Store 新增**: `updateCabinet`, `updateItem`, `deleteActionLog`
- **依赖安装**: `react-native-webview`, `gesture-handler/reanimated/svg` (之前已装)
- **问题修复**: React 版本固定为 19.2.3，移除 babel.config.js，修复 Zustand `|| []` 无限循环
- **ImageCropper 重写**: 修复「点裁剪线缩到最小卡死闪退」bug。改用 `useDragHandler`(useMemo) 创建 PanResponder，添加 3px 拖动阈值防误触，NaN/Infinity 守卫仅在尺寸有效时渲染，12px 内边距补偿，手柄增大至 28px
