# HomeVault 🏠 家庭物品管家

> 拍一拍柜子，记一辈子位置。再也不怕找不到东西。

---

## 目录

- [项目简介](#项目简介)
- [设计理念](#设计理念)
- [核心功能详解](#核心功能详解)
- [用户交互流程](#用户交互流程)
- [UI / UX 设计系统](#ui--ux-设计系统)
- [技术架构](#技术架构)
- [架构决策记录](#架构决策记录)
- [目录结构详解](#目录结构详解)
- [数据库设计](#数据库设计)
  - [ER 关系图](#er-关系图)
  - [建表 SQL](#建表-sql)
  - [完整 API 文档](#完整-api-文档)
- [状态管理](#状态管理)
- [图片处理管线](#图片处理管线)
- [导航与路由](#导航与路由)
- [组件树](#组件树)
- [开发指南](#开发指南)
  - [环境配置](#环境配置)
  - [启动项目](#启动项目)
  - [构建部署](#构建部署)
- [使用指南](#使用指南)
  - [首次使用](#首次使用)
  - [日常使用场景](#日常使用场景)
  - [数据管理](#数据管理)
- [常见问题排查](#常见问题排查)
- [开发计划](#开发计划)

---

## 项目简介

**HomeVault** 是一个面向家庭的物品位置管理 App，解决「家里东西放哪了」的普遍痛点。

### 核心场景

> 小明的钥匙放在书房书桌抽屉里，三个月后找不到了。
> 他打开 HomeVault → 搜"钥匙" → 显示「书房 → 书桌抽屉 → 🔑 钥匙」→ 点[拿走] → 去抽屉拿

### 解决的问题

| 痛点 | 解决方案 |
|---|---|
| 东西放哪了记不住 | 拍照归档，搜索直达位置 |
| 拿走了不记得有没有还 | 状态标记 + 操作时间线 |
| 家人乱拿东西不知道 | 多用户数据共享（规划中） |
| 收纳后找不到东西 | 结构化层级：家→房间→柜子→物品 |

---

## 设计理念

### 核心原则

1. **搜索优先** — 用户的主要行为是「找东西」，搜索框放在首页最显眼位置
2. **操作极简** — 拿取物品不超过 2 步（搜索 → 点[拿走]），减少使用阻力
3. **降低录入门槛** — 拍照自动生成缩略图，无需手动选图标
4. **数据即记录** — 每次操作自动生成时间线，无需手动记日志
5. **视觉愉悦** — 像素卡通风格让整理收纳变得有趣，而不是另一件家务

### 为什么不用 NFC/二维码？

- NFC 需要额外购买标签贴纸，增加使用成本
- 二维码需要打印，磨损后需更换
- 拍照是最自然的记录方式，手机人人都有

### 为什么本地存储优先？

- 用户「打开就能用」，不需要注册/登录/网络
- 隐私安全，物品照片和位置数据不外传
- 家庭共享可以后续基于本地数据做 P2P 同步

---

## 核心功能详解

### 🏠 户型图编辑器

首页是 **像素风户型图画布**，每个房间是一个彩色方块：

- **添加房间** — 点击右下角 [+] 按钮，输入房间名称自动生成方块
- **拖拽移动** — 长按房间方块拖拽到任意位置
- **调整大小** — 拖拽方块右下角 resize 手柄调整宽高
- **点击进入** — 点击方块进入房间内部
- **长按重命名** — 长按方块弹出重命名
- **删除房间** — 点击方块右上角 X 删除（同时删除柜子和物品）
- **颜色自动分配** — 新房间从预设的 8 色板中自动取色

### 📸 拍照→卡通风缩略图

**处理管线：**

```
用户拍照/选图
    ↓
expo-image-manipulator 处理
    ├── resize 至 200x200
    ├── compress 0.7 (JPEG)
    ↓
保存到应用本地目录
    ├── thumbs/thumb_{timestamp}.jpg  (缩略图)
    └── thumbs/orig_{timestamp}.jpg   (原图备份)
```

**为什么这么做：**
- 纯客户端处理，无需网络，不消耗流量
- 缩略图减少存储占用（200x200 JPEG 约 10-20KB）
- 保留原图供详情页查看

### 🔍 全局搜索

- **入口**：首页顶部搜索框（点击或直接聚焦）
- **搜索范围**：物品名称 + 备注（LIKE 模糊匹配）
- **结果展示**：物品名 + emoji + 路径（房间→柜子）+ 状态（在家/已拿走）
- **即时操作**：搜索结果中直接点[拿走]或[放回]，无需进入详情页
- **点击跳转**：点结果行进入物品详情页

### ⚡ 一键拿取

**设计原则：减少操作步骤才能让人愿意用**

```
传统 App 流程（5 步）：
  打开 App → 进房间 → 进柜子 → 找到物品 → 点[拿走]

HomeVault 流程（2 步）：
  打开 App → 搜"关键词" → 点[拿走]
```

### 📋 个人时间线

底部 Tab「👤 我的」包含两个子视图：

**已拿物品（默认视图）：**
- 展示当前所有标记为「已拿走」的物品
- 按时间倒序排列
- 每行显示：物品名 + 路径 + 拿走时间 + [放回]按钮
- 未拿物品时显示空状态「全部物品都在原位 🎉」

**操作记录（历史日志）：**
- 按日期分组展示所有操作（拿走/放回）
- 每组显示日期，每条显示时间+操作
- 已拿走的物品旁仍有 [放回] 按钮

### 📦 物品详情页

点击物品进入详情页，展示：

- **大图**— 原始照片（如有）或 emoji
- **基本信息**— 名称、数量、备注
- **状态**— 在家🟢 / 已拿走⚪
- **操作按钮**— [拿走物品] / [放回物品]
- **操作历史**— 时间线展示此物品的所有操作记录

---

## 用户交互流程

### 核心流程图

```
┌─────────────────────────────────────────────────┐
│                  首页 (户型图)                     │
│  ┌───────────────────────────────────────────┐   │
│  │ [🔍 搜索全家物品...]                       │   │
│  ├───────────────────────────────────────────┤   │
│  │                                           │   │
│  │  ┌────────┐  ┌────────┐                   │   │
│  │  │ 🛏️     │  │ 📚     │                   │   │
│  │  │ 卧室   │  │ 书房   │                   │   │
│  │  └────────┘  └────────┘                   │   │
│  │  ┌────────┐  ┌────────┐                   │   │
│  │  │ 🛋️     │  │ 🍳     │                   │   │
│  │  │ 客厅   │  │ 厨房   │                   │   │
│  │  └────────┘  └────────┘                   │   │
│  │                               ┌───┐        │   │
│  │                               │ + │        │   │
│  │                               └───┘        │   │
│  └───────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  🏠 家                    👤 我的                 │
└─────────────────────────────────────────────────┘
         │                            │
         ▼                            ▼
  ┌────────────────┐         ┌────────────────┐
  │   房间详情       │         │  已拿物品列表    │
  │ ┌────┐ ┌────┐  │         │ 🔑钥匙 2024/1/1 │
  │ │📦  │ │📦  │  │         │ [放回]          │
  │ │抽屉│ │衣柜│  │         │ 🔋充电器 2024/1/2│
  │ └────┘ └────┘  │         │ [放回]          │
  │      [📸+]     │         └────────────────┘
  └────────┬───────┘
           ▼
  ┌────────────────┐
  │   柜子详情       │
  │ ┌────┐ ┌────┐  │
  │ │🔑  │ │✏️   │  │
  │ │钥匙│ │笔   │  │
  │ └────┘ └────┘  │
  │      [+]       │
  └────────┬───────┘
           ▼
  ┌────────────────┐
  │   物品详情       │
  │  ┌──────────┐   │
  │  │   🔑     │   │
  │  └──────────┘   │
  │  钥匙           │
  │  数量: 1        │
  │  状态: 🟢在家    │
  │  [拿走物品]      │
  │  ── 操作记录 ──  │
  │  1/1 拿走了      │
  └────────────────┘
```

### 用户操作路径矩阵

| 场景 | 路径 | 步骤数 |
|---|---|---|
| 找钥匙 | 首页搜索 → 点[拿走] | 2 步 |
| 还充电器 | 👤我的 → 点[放回] | 2 步 |
| 添加新柜子 | 进房间 → 点[拍柜子] | 2 步 |
| 添加新物品 | 进柜子 → 点[添加物品] | 2 步 |
| 查看物品位置 | 首页搜 → 看路径 | 1 步 |
| 整理房间布局 | 首页拖拽方块 | 1 步 |

---

## UI / UX 设计系统

### 色彩系统

```
主色调:    #FF8C69 (暖珊瑚色)    — 按钮、重点元素
背景色:    #FFF8F0 (暖白色)      — 页面背景
卡片色:    #FFFFFF (白色)        — 卡片/弹窗背景
文字色:    #3D2B1F (暖深棕)      — 主文字
次要文字:  #8B7355 (暖灰棕)      — 辅助文字
绿:        #4CAF50               — 放回/在家状态
灰:        #D0D0D0               — 已拿走状态/禁用
红:        #FF6B6B               — 删除/错误

房间色板:
  #FFE4B5 (moccasin)   #B5D8FF (浅蓝)
  #FFB5C5 (浅粉)       #B5FFB5 (浅绿)
  #FFD5B5 (杏色)       #D5B5FF (浅紫)
  #FFFFB5 (浅黄)       #B5FFFF (浅青)
```

### 间距系统

- 页面边距: 20px
- 卡片间距: 12px
- 网格 gap: 12px
- 内边距(padding): 12-14px
- 圆角: 12-20px

### 字体

- 主标题: 28px, Bold
- 页面标题: 22px, Bold
- 卡片标题: 14-15px, Semibold
- 正文: 14-16px, Regular
- 辅助文字: 11-12px

### 图标

- 功能图标: Ionicons (@expo/vector-icons)
- 物品图标: Emoji（自动匹配或用户选择）
- 房间图标: 根据名称自动匹配 Emoji

### 交互反馈

| 操作 | 反馈 |
|---|---|
| 点击卡片 | 路由跳转（slide_from_right 动画） |
| 弹窗 | 模态弹出（slide_from_bottom 动画） |
| 搜索 | 实时过滤，即时显示结果 |
| 删除 | Alert 确认弹窗 |
| 保存 | 无感保存（本地数据库即时写入） |

---

## 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────┐
│                    UI 层                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Tab 导航 │  │ Stack 导航│  │  Modal 弹窗   │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
├─────────────────────────────────────────────────┤
│                  组件层                           │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Draggable│  │ 网格卡片  │  │ 搜索条/结果    │  │
│  │ Room     │  │ Cabinet/ │  │               │  │
│  │          │  │ Item     │  │               │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
├─────────────────────────────────────────────────┤
│                状态管理层                          │
│  ┌──────────────────────────────────────────┐   │
│  │           Zustand Store                    │   │
│  │  rooms │ cabinets │ items │ searchResults │   │
│  │  actionLogs │ takenItems │ isLoading      │   │
│  └──────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│                  数据层                           │
│  ┌──────────────────────────────────────────┐   │
│  │         SQLite (expo-sqlite)              │   │
│  │  rooms | cabinets | items | action_logs   │   │
│  └──────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│                 基础设施                          │
│  ┌────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Expo   │  │ FileSystem│  │ ImageManip-   │  │
│  │ Router │  │           │  │ ulator        │  │
│  └────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────┘
```

### 技术选型详解

| 技术 | 版本 | 选择理由 |
|---|---|---|
| **Expo (React Native)** | SDK 57 | 一套代码跑 iOS + Android + Web 预览，开发效率高 |
| **expo-router** | 最新 | 文件路由，目录结构即页面结构，减少样板代码 |
| **expo-sqlite** | 最新 | 纯本地 SQLite，零配置，支持事务，查询能力强 |
| **Zustand** | ^5.0 | 比 Redux 轻量，比 Context 高性能，TypeScript 友好 |
| **react-native-gesture-handler** | ^2.32 | 高性能手势处理，支持拖拽、缩放、滑动 |
| **react-native-reanimated** | ^4.5 | 原生级别动画，60fps 流畅交互 |
| **react-native-svg** | ^15.15 | 户型图可能用到（当前用 View 实现，备用方案） |
| **expo-image-manipulator** | 最新 | 纯客户端图片处理（resize/compress/filter） |
| **expo-image-picker** | 最新 | 调用系统相机/相册，跨平台统一 API |
| **expo-file-system** | 最新 | 文件管理（保存/读取图片） |
| **TypeScript** | ~6.0 | 类型安全，减少运行时错误 |

### 为什么不是...

| 方案 | 不选的理由 |
|---|---|
| **Flutter** | Dart 生态不如 JS/TS，包较少；团队需要额外学习 |
| **原生开发 (Swift/Kotlin)** | 开发成本高，需要两套代码 |
| **Firebase** | 用户要求本地存储优先，不需要后端 |
| **AsyncStorage** | 只能存简单 KV，不支持复杂查询 |
| **MMKV** | 同 AsyncStorage，不支持 SQL 查询 |
| **WatermelonDB** | 过度设计，对简单 CRUD 应用来说太重 |

---

## 架构决策记录

### ADR-1: 本地 SQLite 作为主存储

- **状态**: 已采纳
- **背景**: 用户要求本地存储优先，不需要注册登录
- **决策**: 使用 expo-sqlite（封装 SQLite）
- **理由**: 关系型数据（家→房间→柜子→物品）天然适合 SQL 存储，支持 JOIN 查询实现搜索，支持事务保证数据一致性
- **后果**: 多设备同步需后续实现，Web 版本需要 WASM 支持

### ADR-2: 文件路由（expo-router）

- **状态**: 已采纳
- **背景**: 需要清晰的页面导航结构
- **决策**: 使用 expo-router 文件路由约定
- **理由**: 目录结构即路由结构，减少手动配置；支持动态路由 `[id].tsx`；支持 Tab + Stack 混合导航
- **后果**: 目录结构调整会影响路由

### ADR-3: Zustand 而非 Redux

- **状态**: 已采纳
- **背景**: 需要简单高效的状态管理
- **决策**: 使用 Zustand
- **理由**: 零样板代码，直接支持异步 action，TypeScript 类型推断好，包体积小（~1KB）
- **后果**: 不适合大型复杂状态树（但本项目不需要）

### ADR-4: 拍照→缩略图纯客户端处理

- **状态**: 已采纳
- **背景**: 需要将照片转为卡通风格
- **决策**: 使用 expo-image-manipulator 在客户端处理
- **理由**: 无需网络，不依赖第三方 API，无额外成本，保护用户隐私
- **后果**: 效果不如 AI 风格迁移，但足够辨识

---

## 目录结构详解

```
C:\HOMECAULT/
├── app/                              # ★ 页面目录 (expo-router 文件路由)
│   ├── _layout.tsx                   #   根布局：配置 Stack 导航
│   │                                    定义所有页面的路由和展示模式
│   │                                    (modal / push)
│   │
│   ├── (tabs)/                       #   底部 Tab 导航组
│   │   ├── _layout.tsx               │   Tab 配置：家 / 我的
│   │   │                                 Tab 图标、颜色、样式
│   │   ├── index.tsx                 │   🏠 首页：户型图画布
│   │   │                                 房间方块拖拽/缩放
│   │   │                                 顶部全局搜索入口
│   │   │                                 添加房间弹窗
│   │   └── profile.tsx               │   👤 我的页面
│   │                                      已拿物品列表
│   │                                      操作记录时间线
│   │                                      一键放回
│   │
│   ├── room/                         #   房间详情页
│   │   └── [id].tsx                  │   URL: /room/:id
│   │                                     展示柜子网格
│   │                                     底部浮动按钮 → 拍柜子
│   │                                     长按删除柜子
│   │
│   ├── cabinet/                      #   柜子详情页
│   │   └── [id].tsx                  │   URL: /cabinet/:id
│   │                                     展示物品网格
│   │                                     已拿走物品半透明+角标
│   │                                     底部浮动按钮 → 添加物品
│   │                                     长按删除物品
│   │
│   ├── item/                         #   物品详情页
│   │   └── [id].tsx                  │   URL: /item/:id
│   │                                     大图/emoji
│   │                                     基本信息 + 状态
│   │                                     [拿走]/[放回] 按钮
│   │                                     操作时间线
│   │
│   ├── search.tsx                    #   全局搜索（Modal 模式）
│   │                                     搜索框（自动聚焦）
│   │                                     实时模糊匹配
│   │                                     结果列表 + 路径 + 操作按钮
│   │
│   ├── add-room.tsx                  #   添加房间（Modal 模式）
│   │                                     房间名称输入
│   │                                     8 种颜色选择器
│   │
│   ├── add-cabinet.tsx               #   拍柜子（Modal 模式）
│   │                                     拍照/选图区域
│   │                                     柜子名称输入
│   │                                     自动生成缩略图
│   │
│   └── add-item.tsx                  #   添加物品（Modal 模式）
│                                         拍照/选图区域
│                                         物品名称 | 数量 | 备注
│                                         自动生成缩略图
│
├── lib/                              # ★ 核心逻辑
│   ├── database.ts                   #   数据库模块
│   │                                     建表初始化
│   │                                     4 张表的完整 CRUD
│   │                                     JOIN 查询（搜索、时间线）
│   │                                     事务支持
│   │
│   └── imageProcessor.ts             #   图片处理模块
│                                         读取 → resize → compress → 保存
│                                         缩略图 / 原图双份存储
│
├── store/                            # ★ 状态管理
│   └── useStore.ts                   #   Zustand Store
│                                         房间/柜子/物品/搜索结果
│                                         异步 action 调用 database.ts
│                                         数据变更自动刷新 UI
│
├── types/                            # ★ TypeScript 类型
│   └── index.ts                      #   6 个接口定义
│                                         Room / Cabinet / Item / ActionLog
│                                         ItemWithPath / ActionLogWithItem
│
├── assets/                           # 静态资源（图标、字体等）
│
├── app.json                          # Expo 配置
│                                         名称、图标、权限声明
│                                         scheme、插件列表
│
├── tsconfig.json                     # TypeScript 配置
│                                         路径别名 @/ 指向根目录
│
├── package.json                      # 依赖管理 + 脚本
│                                         scripts: start / android / ios / web
│
└── README.md                         # ★ 本文档
```

---

## 数据库设计

### ER 关系图

```
┌──────────────┐
│    rooms      │
├──────────────┤
│ id (PK)      │──┐
│ name          │  │   ┌────────────────┐
│ positionX     │  │   │   cabinets      │
│ positionY     │  ├───│────────────────│
│ width         │  │   │ id (PK)         │──┐
│ height        │  │   │ roomId (FK)     │  │
│ color         │  │   │ name            │  │
│ createdAt     │  │   │ photoUri        │  │   ┌────────────────┐
└──────────────┘  │   │ thumbnailUri    │  │   │     items       │
                  │   │ positionX       │  │   │────────────────│
                  │   │ positionY       │  ├───│ id (PK)         │──┐
                  │   │ createdAt       │  │   │ cabinetId (FK)  │  │
                  │   └────────────────┘  │   │ name            │  │   ┌──────────────────┐
                  │                       │   │ quantity        │  │   │   action_logs     │
                  │                       │   │ notes           │  │   │──────────────────│
                  │                       │   │ photoUri        │  │   │ id (PK)            │
                  │                       │   │ thumbnailUri    │  │   │ itemId (FK)        │
                  │                       │   │ status          │  │   │ action              │
                  │                       │   │ takenAt         │  │   │ timestamp           │
                  │                       │   │ createdAt       │  │   └──────────────────┘
                  │                       │   │ updatedAt       │  │
                  │                       │   └────────────────┘  │
                  │                       │                       │
                  └───────────────────────┘                       │
                                                                  │
                                                                  └──────────────────────┘

关系:
  rooms.id    ── 1:N ──> cabinets.roomId
  cabinets.id ── 1:N ──> items.cabinetId
  items.id    ── 1:N ──> action_logs.itemId

级联删除:
  DELETE rooms        → 级联删除 cabinets + items + action_logs
  DELETE cabinets     → 级联删除 items + action_logs
  DELETE items        → 级联删除 action_logs
```

### 建表 SQL

```sql
-- 房间表
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  positionX REAL NOT NULL DEFAULT 0,
  positionY REAL NOT NULL DEFAULT 0,
  width REAL NOT NULL DEFAULT 150,
  height REAL NOT NULL DEFAULT 120,
  color TEXT NOT NULL DEFAULT '#FFE4B5',
  createdAt TEXT NOT NULL
);

-- 柜子表
CREATE TABLE IF NOT EXISTS cabinets (
  id TEXT PRIMARY KEY,
  roomId TEXT NOT NULL,
  name TEXT NOT NULL,
  photoUri TEXT,
  thumbnailUri TEXT,
  positionX REAL NOT NULL DEFAULT 0,
  positionY REAL NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 物品表
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  cabinetId TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT DEFAULT '',
  photoUri TEXT,
  thumbnailUri TEXT,
  status TEXT NOT NULL DEFAULT 'in_place',
  takenAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (cabinetId) REFERENCES cabinets(id) ON DELETE CASCADE
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS action_logs (
  id TEXT PRIMARY KEY,
  itemId TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
);
```

### 完整 API 文档

> 所有函数在 `lib/database.ts` 中定义

#### rooms（房间）

| 函数 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `getRooms()` | 无 | `Promise<Room[]>` | 获取所有房间，按创建时间排序 |
| `addRoom(name, color?)` | `name: string`, `color?: string` | `Promise<Room>` | 创建新房间，自动计算位置 |
| `updateRoom(room)` | `room: Room` | `Promise<void>` | 更新房间属性（名称/位置/大小/颜色） |
| `deleteRoom(id)` | `id: string` | `Promise<void>` | 删除房间（级联删除柜子和物品） |

#### cabinets（柜子）

| 函数 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `getCabinetsByRoom(roomId)` | `roomId: string` | `Promise<Cabinet[]>` | 获取某房间所有柜子 |
| `addCabinet(data)` | `data: Omit<Cabinet, 'id'\|'createdAt'>` | `Promise<Cabinet>` | 添加新柜子 |
| `deleteCabinet(id)` | `id: string` | `Promise<void>` | 删除柜子（级联删除物品） |

#### items（物品）

| 函数 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `getItemsByCabinet(cabinetId)` | `cabinetId: string` | `Promise<Item[]>` | 获取某柜子所有物品 |
| `addItem(data)` | `data: {cabinetId, name, quantity?, notes?, photoUri?, thumbnailUri?}` | `Promise<Item>` | 添加新物品 |
| `updateItem(item)` | `item: Item` | `Promise<void>` | 更新物品信息 |
| `takeItem(itemId)` | `itemId: string` | `Promise<void>` | 标记物品为「已拿走」+ 写操作日志 |
| `returnItem(itemId)` | `itemId: string` | `Promise<void>` | 标记物品为「已放回」+ 写操作日志 |
| `deleteItem(id)` | `id: string` | `Promise<void>` | 删除物品（级联删除操作日志） |
| `getItemById(itemId)` | `itemId: string` | `Promise<Item\|null>` | 获取单个物品详情 |

#### 搜索

| 函数 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `searchItems(query)` | `query: string` | `Promise<ItemWithPath[]>` | 搜索物品（LIKE 匹配名称+备注），返回包含路径信息 |

#### 日志

| 函数 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `getActionLogs()` | 无 | `Promise<ActionLogWithItem[]>` | 获取全部操作日志（含物品/房间/柜子信息），按时间倒序 |
| `getTakenItems()` | 无 | `Promise<ItemWithPath[]>` | 获取所有「已拿走」物品 |
| `getItemHistory(itemId)` | `itemId: string` | `Promise<ActionLog[]>` | 获取单个物品的操作历史 |

### 查询 SQL 示例

```sql
-- 搜索物品（JOIN 三张表获取完整路径）
SELECT i.*,
       c.name AS cabinetName,
       c.roomId,
       r.name AS roomName,
       r.id AS roomId
FROM items i
JOIN cabinets c ON i.cabinetId = c.id
JOIN rooms r ON c.roomId = r.id
WHERE i.name LIKE '%钥匙%' OR i.notes LIKE '%钥匙%'
ORDER BY i.updatedAt DESC;

-- 获取操作日志（含完整路径）
SELECT l.*,
       i.name AS itemName,
       c.name AS cabinetName,
       c.id AS cabinetId,
       r.name AS roomName,
       r.id AS roomId
FROM action_logs l
JOIN items i ON l.itemId = i.id
JOIN cabinets c ON i.cabinetId = c.id
JOIN rooms r ON c.roomId = r.id
ORDER BY l.timestamp DESC;

-- 获取所有已拿走物品
SELECT i.*,
       c.name AS cabinetName,
       c.roomId,
       r.name AS roomName,
       r.id AS roomId
FROM items i
JOIN cabinets c ON i.cabinetId = c.id
JOIN rooms r ON c.roomId = r.id
WHERE i.status = 'taken'
ORDER BY i.takenAt DESC;
```

---

## 状态管理

### Zustand Store 结构

```typescript
interface AppState {
  // 数据
  rooms: Room[];
  cabinets: Record<string, Cabinet[]>;    // key: roomId
  items: Record<string, Item[]>;          // key: cabinetId
  searchResults: ItemWithPath[];
  actionLogs: ActionLogWithItem[];
  takenItems: ItemWithPath[];
  isLoading: boolean;

  // Action - 房间
  loadRooms: () => Promise<void>;
  addRoom: (name: string, color?: string) => Promise<Room>;
  updateRoom: (room: Room) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  // Action - 柜子
  loadCabinets: (roomId: string) => Promise<void>;
  addCabinet: (data: ...) => Promise<Cabinet>;
  deleteCabinet: (id: string, roomId: string) => Promise<void>;

  // Action - 物品
  loadItems: (cabinetId: string) => Promise<void>;
  addItem: (data: ...) => Promise<Item>;
  takeItem: (itemId: string) => Promise<void>;
  returnItem: (itemId: string) => Promise<void>;
  deleteItem: (id: string, cabinetId: string) => Promise<void>;

  // Action - 搜索
  search: (query: string) => Promise<void>;

  // Action - 日志
  loadActionLogs: () => Promise<void>;
  loadTakenItems: () => Promise<void>;

  // Action - 全局
  refreshAll: () => Promise<void>;
}
```

### 数据流

```
用户操作 (UI)
    │
    ▼
Store Action (useStore)
    │
    ├── 更新本地状态（set）
    │
    └── 调用 Database API (lib/database.ts)
            │
            ▼
        SQLite 读写
            │
            ▼
        持久化存储
```

### 为什么数据存在 Store 而不是直接读 DB？

1. **响应式 UI** — React 组件订阅 Store 变化自动重渲染
2. **避免重复查询** — 已加载的数据在内存中缓存
3. **乐观更新** — 先更新 UI，再写 DB（失败时回滚）
4. **解耦** — UI 不直接依赖数据库实现

---

## 图片处理管线

### 处理流程

```
拍照/选图
    │
    ▼
原始 URI (来自 camera/image picker)
    │
    ├──→ saveOriginalImage(uri)
    │         │
    │         ├── FileSystem.copy → orig_{timestamp}.jpg
    │         │
    │         └── 返回 原图路径
    │
    └──→ processToThumbnail(uri)
              │
              ├── ImageManipulator.resize(200x200)
              ├── ImageManipulator.compress(0.7, JPEG)
              ├── FileSystem.copy → thumb_{timestamp}.jpg
              │
              └── 返回 缩略图路径
```

### 为什么 200x200？

| 尺寸 | 优点 | 缺点 |
|---|---|---|
| 100x100 | 极小，加载快 | 无法辨识物品 |
| **200x200** | **体积小(~15KB)，能辨识** | **—** |
| 400x400 | 清晰 | ~60KB，网格布局加载慢 |

### 存储位置

```
{app document directory}/
└── thumbs/
    ├── orig_1712345678.jpg    (原图，保留细节)
    ├── thumb_1712345678.jpg   (缩略图，200x200)
    ├── orig_1712345689.jpg
    └── thumb_1712345689.jpg
```

---

## 导航与路由

### 路由表

| 路径 | 页面 | 导航类型 | 参数 |
|---|---|---|---|
| `/` | 首页（户型图） | Tab | 无 |
| `/profile` | 个人中心 | Tab | 无 |
| `/room/[id]` | 房间详情 | Push | id: roomId |
| `/cabinet/[id]` | 柜子详情 | Push | id: cabinetId |
| `/item/[id]` | 物品详情 | Push | id: itemId |
| `/search` | 全局搜索 | Modal | 无 |
| `/add-room` | 添加房间 | Modal | 无 |
| `/add-cabinet` | 拍柜子 | Modal | roomId |
| `/add-item` | 添加物品 | Modal | cabinetId |

### 导航结构

```
Root Stack
├── (tabs)                 ← Tab Navigator
│   ├── index              ← Home Tab (户型图)
│   └── profile           ← Profile Tab (时间线)
├── room/[id]              ← Push screen
├── cabinet/[id]           ← Push screen
├── item/[id]              ← Push screen
├── search                 ← Modal
├── add-room               ← Modal
├── add-cabinet            ← Modal
└── add-item               ← Modal
```

---

## 组件树

### 页面组件依赖

```
app/_layout.tsx
└── <Stack>
    ├── app/(tabs)/_layout.tsx
    │   └── <Tabs>
    │       ├── app/(tabs)/index.tsx
    │       │   ├── DraggableRoom        (x N)  ← 房间方块
    │       │   ├── [添加房间弹窗]         Modal
    │       │   └── [搜索条]              → 跳转 /search
    │       │
    │       └── app/(tabs)/profile.tsx
    │           ├── TakenItemsView       ← 已拿物品列表
    │           └── ActionLogsView       ← 操作记录时间线
    │
    ├── app/room/[id].tsx
    │   ├── CabinetCard (x N)            ← 柜子卡片网格
    │   └── [FAB: 拍柜子]                → 跳转 /add-cabinet
    │
    ├── app/cabinet/[id].tsx
    │   ├── ItemCard (x N)               ← 物品卡片网格
    │   └── [FAB: 添加物品]              → 跳转 /add-item
    │
    ├── app/item/[id].tsx
    │   ├── 大图/emoji
    │   ├── InfoCard                     ← 基本信息
    │   ├── [Action Button]              ← 拿走/放回
    │   └── HistorySection               ← 操作时间线
    │
    ├── app/search.tsx
    │   ├── SearchBar
    │   └── ResultItem (x N)             ← 搜索结果 + 操作
    │
    ├── app/add-room.tsx                 ← 表单
    ├── app/add-cabinet.tsx              ← 拍照 + 表单
    └── app/add-item.tsx                 ← 拍照 + 表单
```

### 关键组件职责

| 组件 | 所在文件 | 核心功能 |
|---|---|---|
| `DraggableRoom` | `app/(tabs)/index.tsx:154` | 户型图中的房间方块，支持拖拽和缩放 |
| `TakenItemsView` | `app/(tabs)/profile.tsx:97` | 已拿物品列表，每行含[放回]按钮 |
| `ActionLogsView` | `app/(tabs)/profile.tsx:148` | 按日期分组的操作历史 |
| `CabinetCard` | `app/room/[id].tsx:55` | 柜子卡片（缩略图+名称） |
| `ItemCard` | `app/cabinet/[id].tsx:53` | 物品卡片（emoji+名称+状态角标） |

---

## 开发指南

### 环境配置

**需要安装：**

- **Node.js** >= 18（推荐 20+）
- **npm** 或 **yarn**
- **Expo Go**（手机测试用，可选）
- **VS Code**（推荐编辑器，可选）

**验证安装：**

```bash
node --version    # ≥ 18
npm --version     # ≥ 9
npx expo --version
```

### 启动项目

```bash
# 1. 进入项目
cd C:\homevault

# 2. 安装依赖（首次运行或拉取更新后）
npm install

# 3. 启动开发服务器
npm start

# 4a. Web 预览（开发调试用）
npm run web       # 浏览器打开 http://localhost:19006

# 4b. Android 真机
npm run android   # 需连接设备或模拟器

# 4c. iOS 模拟器
npm run ios       # 仅 macOS
```

### 常用命令

```bash
# 添加 Expo 官方包（自动匹配版本）
npx expo install [package-name]

# 检查依赖兼容性
npx expo install --check

# 修复依赖版本
npx expo install --fix

# TypeScript 类型检查
npx tsc --noEmit

# 清除 Metro 缓存
npx expo start -c
```

### 构建部署

```bash
# Android APK
npx eas build --platform android --profile preview

# iOS IPA
npx eas build --platform ios --profile preview

# 发布到应用商店
npx eas submit --platform android
npx eas submit --platform ios
```

> 首次构建需要注册 Expo 账号并配置 EAS Build

### 开发规范

- **文件命名**: `kebab-case.tsx`（expo-router 约定），页面用 `[param].tsx`
- **组件命名**: PascalCase
- **函数命名**: camelCase
- **类型定义**: 统一放在 `types/index.ts`
- **样式**: StyleSheet.create，不引入 CSS-in-JS 方案
- **颜色变量**: 每个文件顶部定义 COLORS 常量
- **回调**: 使用 useCallback 避免不必要的重渲染
- **图片**: 优先用 emoji，拍照用 expo-image-picker

---

## 使用指南

### 首次使用

**Step 1: 创建房间**

```
打开 App
    ↓
首页是空白画布
    ↓
点击右下角 [+添加房间]
    ↓
输入"卧室" → 点击[创建]
    ↓
卧室方块出现在画布上
```

**Step 2: 添加柜子**

```
点击卧室方块
    ↓
进入房间（空的）
    ↓
点击底部 [📸拍柜子]
    ↓
拍照/选图 → 输入"床头柜"
    ↓
点击[创建柜子] → 自动生成缩略图
    ↓
床头柜出现在房间网格中
```

**Step 3: 添加物品**

```
点击床头柜
    ↓
进入柜子（空的）
    ↓
点击底部 [添加物品]
    ↓
拍照/选图 → 输入"钥匙"
    ↓
（可选）填写数量、备注
    ↓
点击[添加物品] → 自动生成缩略图
    ↓
🔑钥匙出现在柜子网格中
```

### 日常使用场景

#### 场景 A: 找钥匙

```
1. 打开 App → 首页
2. 点击顶部搜索框（或直接输入）
3. 输入"钥匙"
4. 结果：📌 书房 → 书桌抽屉 → 🔑钥匙 [在家]
5. 点击 [拿走] → ✅ 记录完成
```

#### 场景 B: 还充电器

```
1. 打开 App → 👤 我的
2. 看到「当前拿走了 3 件物品」
3. 找到「🔋充电器」
4. 点击 [放回] → ✅ 记录完成
```

#### 场景 C: 搬新家整理

```
1. 打开 App → 首页
2. 长按已有房间 → 重命名
3. 拖拽方块到对应位置
4. 拖角落调整大小
5. 添加新房间
```

#### 场景 D: 忘记有没有还螺丝刀

```
1. 打开 App → 👤 我的
2. 看「已拿物品」列表
3. 有螺丝刀 → 还没还
4. 点 [放回] → 标记已还
```

### 数据管理

**当前版本：** 无需手动备份。数据存在手机本地 SQLite 中，删除 App 会丢失数据。

**注意：** 预期未来版本会支持数据导出/导入和云同步。

---

## 常见问题排查

### 1. 浏览器打开是白屏

```
可能原因：SQLite Web 兼容性问题
解决方案：用手机 Expo Go 测试
```

**如果是 Web 开发报错：**

```bash
# 确保安装了 web 依赖
npx expo install react-native-web react-dom @expo/metro-runtime
```

### 2. 无法拍照/选图

```
可能原因：权限未授予
解决方案：
  iOS: 设置 → 隐私 → 相机/相册 → 开启
  Android: 设置 → 应用 → HomeVault → 权限 → 开启
  Web: 浏览器地址栏左侧的锁定图标 → 网站设置 → 摄像头
```

### 3. React 版本不匹配报错

```bash
npm install react-dom@19.2.8
```

### 4. 页面无法加载或路由404

```
可能原因：expo-router 文件路由命名问题
检查：
  - 目录名 (tabs) 带括号是正确的（表示 Tab 组）
  - 动态路由 [id].tsx 用方括号
  - 文件首字母大小写
```

### 5. 数据库报错

```bash
# 清除所有数据（开发调试用）
# 删除 App 重新安装，或清除 App 数据
```

### 6. 性能问题（大量物品时卡顿）

```
优化建议：
  - 使用 FlatList 替代 ScrollView（当前版本未实现）
  - 图片懒加载
  - 数据库分页查询
```

---

## 开发计划

### Phase 1 ✅（已完成）

- [x] 项目初始化 + Expo + TypeScript
- [x] SQLite 数据库设计 + 完整 CRUD
- [x] 户型图画布（房间添加/拖拽/缩放）
- [x] 房间页（柜子网格 + 拍柜子）
- [x] 柜子页（物品网格 + 添加物品）
- [x] 物品详情页（大图 + 信息 + 操作历史）
- [x] 图片处理管线（拍照→缩略图）
- [x] 全局搜索（模糊匹配 + 一键拿取/放回）
- [x] 个人时间线（已拿物品 + 操作记录）
- [x] 全本地存储

### Phase 2 🔜（下一阶段）

- [ ] **房间内柜子自由画布拖拽** — 替代固定网格，可自由摆放柜子位置
- [ ] **多用户 / 家庭共享** — 家人共用数据，互相看到谁拿了什么
- [ ] **数据导出 / 导入** — 备份与迁移
- [ ] **搜索增强** — 分类筛选、高级搜索（按房间/柜子筛选）
- [ ] **物品分类标签** — 自定义标签，按类别浏览

### Phase 3 📌（远期规划）

- [ ] **云同步** — 多设备数据同步
- [ ] **通知提醒** — 拿走超过 N 天未放回时推送提醒
- [ ] **NFC 标签支持** — 贴标签在柜子上，手机一碰直达
- [ ] **Siri/快捷指令** — 语音搜索 "Siri，我家钥匙在哪"
- [ ] **Widget** — 手机桌面 Widget 展示最近物品
- [ ] **批量操作** — 批量添加/删除/移动物品
- [ ] **Dark Mode** — 深色模式

---

## 贡献指南

本项目为个人/家庭项目，当前暂不接受外部贡献。但欢迎：

- **提 bug** — 描述复现步骤和环境
- **提建议** — 功能请求和改进想法
- **分享使用心得** — 你是怎么用 HomeVault 的

---

*HomeVault — 让每一件东西都找得到。*
