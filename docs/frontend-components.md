# 前端组件 API

## AIRuleAnalyzer

路径：`src/components/AIRuleAnalyzer.tsx`

跨模块复用的「自然语言 → 结构化规则 → ERP 取数 → 结果表」组件，已在 Expense / Payable / Receivable / Risk 四个页面接入。

### Props

```ts
type Props = {
  module: string;                  // 模块名，用于标题与导出文件名
  examples: string[];              // 抽屉内的示例 prompt，鼠标点击可填入
  scenarios: AnalyzerScenario[];   // 预置场景（mock 阶段）
  fallback: AnalyzerScenario;      // 未命中场景时的兜底
  fieldOptions: string[];          // 该模块可选字段，驱动规则编辑下拉
};

type AnalyzerScenario = {
  match: string[];                 // 命中关键词
  rules: RuleItem[];               // 默认规则集
  columns: string[];               // 结果表列
  rows: (string | number)[][];     // 结果表行
  source: string;                  // 数据源描述
};

type RuleItem = {
  id: string;
  type: "时间" | "筛选" | "分组" | "聚合" | "排序" | "限制";
  field: string;
  op?: string;
  value: string;
};
```

### 基本用法

```tsx
import { AIRuleAnalyzer, type AnalyzerScenario } from "@/components/AIRuleAnalyzer";

const ANALYZER_FIELDS = ["部门", "金额", "员工", "日期", "类别"];

const SCENARIOS: AnalyzerScenario[] = [
  {
    match: ["研发", "5000"],
    rules: [
      { id: "1", type: "筛选", field: "部门", op: "=", value: "研发部" },
      { id: "2", type: "筛选", field: "金额", op: ">", value: "5000" },
      { id: "3", type: "分组", field: "部门", op: "按", value: "" },
      { id: "4", type: "聚合", field: "金额", op: "合计", value: "" },
    ],
    columns: ["部门", "合计金额", "单据数"],
    rows: [["研发中心", 184500, 12]],
    source: "金蝶 ERP · 报销主表",
  },
];

<AIRuleAnalyzer
  module="报销"
  examples={["上月研发部超 5000 元报销 Top10", "本季度市场部餐费合计"]}
  scenarios={SCENARIOS}
  fallback={SCENARIOS[0]}
  fieldOptions={ANALYZER_FIELDS}
/>;
```

### 行为说明

- 点击「配置规则」打开右侧抽屉，支持新增 / 删除 / 修改任意条规则。
- 抽屉内的自然语言区会调用 `parseFromNL`（当前为 mock；接入真实接口请替换为 `POST /api/ai/parse-rules`）。
- 「取数并生成结果」按钮触发 `run`（mock；对接 `POST /api/ai/run`）。
- 结果表支持下载 CSV、推送钉钉（对接 `POST /api/ai/export` 与 `/api/ai/notify/dingtalk`）。

### 接入真实后端

在 `AIRuleAnalyzer.tsx` 中将 `setTimeout` 替换为 `fetch`：

```ts
const res = await fetch("/api/ai/run", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ module, rules }),
});
const { data } = await res.json();
setResult(data);
```

---

## StatusBadge / RiskBadge

路径：`src/components/StatusBadge.tsx`

```tsx
<StatusBadge status="待人工确认" />
<RiskBadge level="高" />
```

颜色全部走设计令牌（`--success / --warning / --destructive / --info`），自动适配主题。

---

## AppShell

路径：`src/components/AppShell.tsx`

应用级布局：左侧导航 + 顶部条 + `<Outlet />`。新增页面只需在 `App.tsx` 路由表中注册即可。
