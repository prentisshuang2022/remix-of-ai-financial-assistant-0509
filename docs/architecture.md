# 架构总览

## 技术栈

- **前端**：React 18 + TypeScript 5 + Vite 5
- **样式**：Tailwind CSS v3 + shadcn/ui，所有色彩走 `index.css` 语义令牌
- **路由**：React Router v6
- **状态/数据**：`@tanstack/react-query`（预留远端取数）
- **图标**：`lucide-react`
- **后端（规划）**：Lovable Cloud（Postgres + Edge Functions + Auth + Storage）
- **外部系统**：金蝶 ERP（取数）、钉钉开放平台（消息推送）

## 目录结构

```text
src/
├── App.tsx                 # 路由入口
├── components/
│   ├── AppShell.tsx        # 全局布局/导航
│   ├── AIRuleAnalyzer.tsx  # AI 自定义分析组件（可复用）
│   ├── StatusBadge.tsx     # 状态/风险徽章
│   └── ui/                 # shadcn 基础组件
├── pages/
│   ├── Dashboard.tsx
│   ├── Expense.tsx / ExpenseDetail.tsx
│   ├── Payable.tsx
│   ├── Receivable.tsx
│   └── Risk.tsx
├── hooks/                  # use-toast 等
└── index.css               # 设计令牌（HSL）
docs/                       # 本文档目录
```

## 数据流（AI 规则分析）

```text
 ┌───────────────┐      ┌──────────────┐      ┌──────────────┐
 │ 自然语言输入   │ ───▶ │ AI 规则解析   │ ───▶ │ RuleItem[]    │
 └───────────────┘      └──────────────┘      └──────┬───────┘
                                                     │
                                              结构化编辑（抽屉）
                                                     │
                                                     ▼
              ┌─────────────────────────────────────────────┐
              │  ERP 取数（金蝶）→ 聚合/排序/限制 → 结果表  │
              └────────────────────┬────────────────────────┘
                                   │
                       ┌───────────┴───────────┐
                       ▼                       ▼
                  下载 CSV                发送至钉钉群
```

## 设计系统约束

- 颜色一律使用 `hsl(var(--token))`，禁止硬编码 `#xxx` 或 `text-white` 等绝对色类
- 圆角、阴影、渐变在 `tailwind.config.ts` 与 `index.css` 中集中定义
- 暗色/亮色模式自动适配
