import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Download, Sparkles, ChevronRight, X } from "lucide-react";
import { RiskBadge, StatusBadge } from "@/components/StatusBadge";
import { AIRuleAnalyzer, type AnalyzerScenario } from "@/components/AIRuleAnalyzer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const kpis = [
  { label: "今日报销单", value: "186", sub: "笔" },
  { label: "高风险单", value: "23", sub: "笔 · 占比 12.4%", tone: "destructive" },
  { label: "重复票据疑似", value: "7", sub: "张 · 涉及 5 笔", tone: "warning" },
  { label: "待人工复核", value: "31", sub: "笔" },
  { label: "AI 建议通过率", value: "78.6%", sub: "近 7 日均值", tone: "success" },
];

const rows = [
  {
    id: "BX-2025-04-1083",
    user: "王浩",
    dept: "市场部",
    amount: "¥4,820.00",
    cnt: 6,
    rule: { ok: false, hit: 2 },
    dup: { ok: false, n: 1 },
    risk: "高" as const,
    suggest: "退回",
    suggestNote: "餐费发票号尾号集中",
    status: "待人工确认" as const,
  },
  {
    id: "BX-2025-04-1082",
    user: "陈敏",
    dept: "销售一部",
    amount: "¥1,260.00",
    cnt: 3,
    rule: { ok: true, hit: 0 },
    dup: { ok: true, n: 0 },
    risk: "低" as const,
    suggest: "通过",
    suggestNote: "符合差旅标准",
    status: "已通过" as const,
  },
  {
    id: "BX-2025-04-1081",
    user: "周奕",
    dept: "研发中心",
    amount: "¥18,450.00",
    cnt: 11,
    rule: { ok: false, hit: 1 },
    dup: { ok: true, n: 0 },
    risk: "中" as const,
    suggest: "转人工",
    suggestNote: "单笔超审批限额 ¥10,000",
    status: "处理中" as const,
  },
  {
    id: "BX-2025-04-1080",
    user: "刘洋",
    dept: "供应链",
    amount: "¥320.00",
    cnt: 1,
    rule: { ok: true, hit: 0 },
    dup: { ok: true, n: 0 },
    risk: "低" as const,
    suggest: "通过",
    suggestNote: "OCR 高置信度",
    status: "已通过" as const,
  },
  {
    id: "BX-2025-04-1079",
    user: "黄琳",
    dept: "市场部",
    amount: "¥2,180.00",
    cnt: 4,
    rule: { ok: false, hit: 1 },
    dup: { ok: false, n: 1 },
    risk: "高" as const,
    suggest: "退回",
    suggestNote: "发票与上月 BX-1042 重复",
    status: "已退回" as const,
  },
  {
    id: "BX-2025-04-1078",
    user: "苏然",
    dept: "财务部",
    amount: "¥860.00",
    cnt: 2,
    rule: { ok: true, hit: 0 },
    dup: { ok: true, n: 0 },
    risk: "低" as const,
    suggest: "通过",
    suggestNote: "符合通讯费标准",
    status: "已通过" as const,
  },
  {
    id: "BX-2025-04-1077",
    user: "高翔",
    dept: "销售二部",
    amount: "¥6,520.00",
    cnt: 5,
    rule: { ok: false, hit: 1 },
    dup: { ok: true, n: 0 },
    risk: "中" as const,
    suggest: "转人工",
    suggestNote: "客户招待无审批附件",
    status: "待人工确认" as const,
  },
];

const FILTER_DEFS: { key: string; label: string; options: string[] }[] = [
  { key: "日期", label: "日期", options: ["今日", "近7天", "近30天", "本月", "本季度"] },
  { key: "部门", label: "部门", options: ["全部", "市场部", "销售一部", "销售二部", "研发中心", "供应链", "财务部"] },
  { key: "报销类型", label: "报销类型", options: ["全部", "差旅", "餐饮招待", "通讯", "办公用品", "培训", "其他"] },
  { key: "风险等级", label: "风险等级", options: ["全部", "高", "中", "低"] },
  { key: "处理状态", label: "处理状态", options: ["全部", "待人工确认", "处理中", "已通过", "已退回"] },
];

const DEFAULTS: Record<string, string> = {
  "日期": "近7天",
  "部门": "全部",
  "报销类型": "全部",
  "风险等级": "全部",
  "处理状态": "全部",
};

const ANALYZER_EXAMPLES = [
  "本月各部门人均餐费 Top 10",
  "近 30 天单笔超 5000 元的差旅报销",
  "市场部近 90 天连号发票汇总",
  "本季度报销金额环比增长超 50% 的部门",
];

const ANALYZER_FIELDS = [
  "提交日期", "部门", "提交人", "费用类型", "报销金额", "发票号", "发票数量",
  "客户", "项目", "审批状态", "风险等级",
];

const ANALYZER_SCENARIOS: AnalyzerScenario[] = [
  {
    match: ["人均", "餐费", "Top"],
    rules: [
      { id: "e1", type: "时间", field: "提交日期", op: "=", value: "本月" },
      { id: "e2", type: "筛选", field: "费用类型", op: "=", value: "餐饮招待" },
      { id: "e3", type: "分组", field: "部门", op: "按", value: "部门" },
      { id: "e4", type: "聚合", field: "报销金额", op: "合计", value: "金额合计" },
      { id: "e5", type: "聚合", field: "提交人", op: "计数", value: "报销人数" },
      { id: "e6", type: "排序", field: "人均金额", op: "降序", value: "" },
      { id: "e7", type: "限制", field: "—", op: "Top", value: "10" },
    ],
    columns: ["部门", "报销人数", "金额合计", "人均金额", "环比"],
    rows: [
      ["市场部", 18, "¥86,420", "¥4,801", "+32.4%"],
      ["销售一部", 22, "¥78,920", "¥3,587", "+8.1%"],
      ["销售二部", 19, "¥61,250", "¥3,224", "-3.5%"],
      ["客户成功部", 12, "¥34,860", "¥2,905", "+12.0%"],
      ["研发中心", 28, "¥69,120", "¥2,468", "+5.2%"],
      ["供应链", 14, "¥31,240", "¥2,232", "-1.0%"],
      ["人力资源", 8, "¥16,400", "¥2,050", "+0.8%"],
      ["财务部", 9, "¥17,280", "¥1,920", "+2.1%"],
      ["IT 信息", 11, "¥18,920", "¥1,720", "-4.6%"],
      ["行政部", 7, "¥10,640", "¥1,520", "+1.2%"],
    ],
    source: "金蝶 ERP · 报销单 + 部门主数据 · 本月（共 1,062 笔）",
  },
  {
    match: ["差旅", "5000", "超"],
    rules: [
      { id: "e8", type: "时间", field: "提交日期", op: "=", value: "近 30 天" },
      { id: "e9", type: "筛选", field: "费用类型", op: "=", value: "差旅费" },
      { id: "e10", type: "筛选", field: "报销金额", op: ">", value: "5000" },
      { id: "e11", type: "排序", field: "报销金额", op: "降序", value: "" },
    ],
    columns: ["报销单号", "提交人", "部门", "金额", "提交日期"],
    rows: [
      ["BX-2025-04-1081", "周奕", "研发中心", "¥18,450", "2025-04-11"],
      ["BX-2025-04-1077", "高翔", "销售二部", "¥6,520", "2025-04-10"],
      ["BX-2025-04-1054", "李珂", "销售一部", "¥9,820", "2025-04-08"],
      ["BX-2025-04-1031", "陈鹏", "市场部", "¥7,450", "2025-04-05"],
      ["BX-2025-03-0998", "吴磊", "供应链", "¥12,680", "2025-03-29"],
    ],
    source: "金蝶 ERP · 报销单（费用类型=差旅） · 近 30 天（共 5 笔）",
  },
];

const ANALYZER_FALLBACK: AnalyzerScenario = {
  match: [],
  rules: [
    { id: "ef1", type: "时间", field: "提交日期", op: "=", value: "近 30 天" },
    { id: "ef2", type: "分组", field: "费用类型", op: "按", value: "费用类型" },
    { id: "ef3", type: "聚合", field: "报销金额", op: "合计", value: "金额合计" },
  ],
  columns: ["维度", "笔数", "金额合计", "占比"],
  rows: [
    ["差旅费", 318, "¥1,302,400", "38.0%"],
    ["业务招待", 196, "¥820,800", "24.0%"],
    ["办公采购", 142, "¥615,600", "18.0%"],
    ["市场费用", 88, "¥410,400", "12.0%"],
    ["培训差补", 42, "¥171,000", "5.0%"],
    ["其他", 26, "¥102,600", "3.0%"],
  ],
  source: "金蝶 ERP · 报销单 · 近 30 天（共 812 笔）",
};

export default function Expense() {
  const [filters, setFilters] = useState<Record<string, string>>(DEFAULTS);

  const activeCount = useMemo(
    () => Object.keys(filters).filter((k) => filters[k] !== DEFAULTS[k]).length,
    [filters]
  );

  return (
    <div className="space-y-5">
      <AIRuleAnalyzer
        module="费用报销"
        examples={ANALYZER_EXAMPLES}
        scenarios={ANALYZER_SCENARIOS}
        fallback={ANALYZER_FALLBACK}
      />

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="h-4 w-4" /> 筛选
            {activeCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                {activeCount}
              </span>
            )}
          </div>
          {FILTER_DEFS.map((f) => {
            const val = filters[f.key];
            const isActive = val !== DEFAULTS[f.key];
            return (
              <DropdownMenu key={f.key}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      isActive
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-background text-foreground hover:border-primary"
                    }`}
                  >
                    <span className={isActive ? "text-primary/70" : "text-muted-foreground"}>{f.label}：</span>
                    {val}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                  {f.options.map((opt) => (
                    <DropdownMenuItem
                      key={opt}
                      onClick={() => setFilters((s) => ({ ...s, [f.key]: opt }))}
                      className={val === opt ? "bg-primary-soft text-primary font-medium" : ""}
                    >
                      {opt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
          {activeCount > 0 && (
            <button
              onClick={() => setFilters(DEFAULTS)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" /> 重置
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">
              <Download className="h-3.5 w-3.5" /> 导出
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90">
              <Sparkles className="h-3.5 w-3.5" /> AI 批量复核
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div
              className={`mt-2 text-2xl font-semibold tabular-nums ${
                k.tone === "destructive"
                  ? "text-destructive"
                  : k.tone === "warning"
                  ? "text-warning"
                  : k.tone === "success"
                  ? "text-success"
                  : "text-foreground"
              }`}
            >
              {k.value}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">报销审核总看板</h3>
          <span className="text-xs text-muted-foreground">显示 1-7 / 共 186 条</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-medium">报销单号</th>
                <th className="px-4 py-2.5 font-medium">提交人 / 部门</th>
                <th className="px-4 py-2.5 font-medium text-right">金额</th>
                <th className="px-4 py-2.5 font-medium text-center">发票</th>
                <th className="px-4 py-2.5 font-medium">规则校验</th>
                <th className="px-4 py-2.5 font-medium">查重</th>
                <th className="px-4 py-2.5 font-medium">风险</th>
                <th className="px-4 py-2.5 font-medium">AI 建议</th>
                <th className="px-4 py-2.5 font-medium">状态</th>
                <th className="px-4 py-2.5 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{r.user}</div>
                    <div className="text-xs text-muted-foreground">{r.dept}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{r.amount}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{r.cnt}</td>
                  <td className="px-4 py-3">
                    {r.rule.ok ? (
                      <span className="text-xs text-success">通过</span>
                    ) : (
                      <span className="text-xs text-destructive">命中 {r.rule.hit} 条</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.dup.ok ? (
                      <span className="text-xs text-success">无重复</span>
                    ) : (
                      <span className="text-xs text-destructive">疑似 {r.dup.n} 张</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><RiskBadge level={r.risk} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-info" />
                      <span
                        className={`text-xs font-medium ${
                          r.suggest === "通过"
                            ? "text-success"
                            : r.suggest === "退回"
                            ? "text-destructive"
                            : "text-warning"
                        }`}
                      >
                        {r.suggest}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{r.suggestNote}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/expense/${r.id}`}
                      className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                    >
                      详情 <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}