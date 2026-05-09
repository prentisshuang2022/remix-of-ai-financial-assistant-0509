import { AlertTriangle } from "lucide-react";
import { RiskBadge, StatusBadge } from "@/components/StatusBadge";
import { AIRuleAnalyzer, type AnalyzerScenario } from "@/components/AIRuleAnalyzer";

const ANALYZER_EXAMPLES = [
  "近 30 天同一供应商被命中重复发票的笔数",
  "本月各业务线高风险事项分布",
  "超 4 小时未处理的高风险任务及负责人",
  "金额异常波动 > 50% 的报销单",
];

const ANALYZER_FIELDS = [
  "发现时间", "风险类型", "风险等级", "处理人", "所在部门", "滞留时长(h)",
  "来源单据", "金额", "状态",
];

const ANALYZER_SCENARIOS: AnalyzerScenario[] = [
  {
    match: ["未处理", "4", "高风险"],
    rules: [
      { id: "k1", type: "筛选", field: "风险等级", op: "=", value: "高" },
      { id: "k2", type: "筛选", field: "滞留时长(h)", op: ">", value: "4" },
      { id: "k3", type: "分组", field: "处理人", op: "按", value: "处理人" },
      { id: "k4", type: "聚合", field: "—", op: "计数", value: "任务数" },
      { id: "k5", type: "排序", field: "滞留时长(h)", op: "降序", value: "" },
    ],
    columns: ["处理人", "高风险任务数", "最长滞留(h)", "平均滞留(h)", "所在部门"],
    rows: [
      ["李婷婷", 6, 9.2, 6.4, "财务部"],
      ["王芳", 4, 7.8, 5.9, "财务部"],
      ["陈明", 3, 6.5, 5.1, "财务部"],
      ["周文", 2, 5.4, 4.8, "应收组"],
      ["未指派", 5, 12.3, 8.6, "—"],
    ],
    source: "金蝶 ERP + 风险中心 · 实时（共 23 项高风险）",
  },
];

const ANALYZER_FALLBACK: AnalyzerScenario = {
  match: [],
  rules: [
    { id: "kf1", type: "时间", field: "发现时间", op: "=", value: "近 30 天" },
    { id: "kf2", type: "分组", field: "风险类型", op: "按", value: "风险类型" },
    { id: "kf3", type: "聚合", field: "—", op: "计数", value: "事项数" },
  ],
  columns: ["风险类型", "高", "中", "低", "合计"],
  rows: [
    ["报销风险", 12, 14, 5, 31],
    ["票据重复", 7, 3, 2, 12],
    ["付款异常", 4, 3, 1, 8],
    ["应收超期", 6, 8, 3, 17],
    ["对账差异", 3, 9, 4, 16],
  ],
  source: "金蝶 ERP + 风险中心 · 近 30 天（共 84 项）",
};

const tabs = [
  { l: "全部", n: 84, active: true },
  { l: "报销风险", n: 31 },
  { l: "票据重复", n: 12 },
  { l: "付款异常", n: 8 },
  { l: "应收超期", n: 17 },
  { l: "对账差异", n: 16 },
];

const rows = [
  { id: "RK-2025-0412-031", type: "报销风险", level: "高" as const, src: "BX-2025-04-1083", desc: "餐费超限 + 缺审批附件", owner: "李婷婷", state: "待人工确认" as const, time: "10分钟前" },
  { id: "RK-2025-0412-030", type: "票据重复", level: "高" as const, src: "BX-2025-04-1079", desc: "与 BX-2025-03-0418 发票号一致", owner: "王芳", state: "处理中" as const, time: "32分钟前" },
  { id: "RK-2025-0412-029", type: "对账差异", level: "中" as const, src: "FL-20250412-1080", desc: "金额相差 ¥20，疑似手续费", owner: "陈明", state: "待人工确认" as const, time: "1小时前" },
  { id: "RK-2025-0412-028", type: "应收超期", level: "中" as const, src: "AR-20250228-007", desc: "Apex Industrial 已超期 14 天", owner: "周文", state: "处理中" as const, time: "3小时前" },
  { id: "RK-2025-0412-027", type: "付款异常", level: "高" as const, src: "AP-20250410-0561", desc: "付款币种与结算币种不一致", owner: "李婷婷", state: "异常" as const, time: "5小时前" },
  { id: "RK-2025-0412-026", type: "对账差异", level: "低" as const, src: "FL-20250411-0917", desc: "未匹配，已自动建议归类", owner: "—", state: "已完成" as const, time: "昨天" },
];

export default function Risk() {
  return (
    <div className="space-y-5">
      <AIRuleAnalyzer
        module="风险预警"
        examples={ANALYZER_EXAMPLES}
        scenarios={ANALYZER_SCENARIOS}
        fallback={ANALYZER_FALLBACK}
      />

      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1 text-sm">
          <div className="font-medium text-foreground">当前共有 23 项高风险事项需立即处理</div>
          <div className="text-xs text-muted-foreground mt-0.5">AI 已按业务线分类并自动指派；超 4 小时未处理将逐级上升提醒</div>
        </div>
        <button className="rounded-md bg-destructive px-3 py-1.5 text-xs text-destructive-foreground hover:opacity-90">批量分派</button>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card p-1.5 shadow-[var(--shadow-card)] inline-flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.l}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              t.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.l} <span className="ml-1 text-xs opacity-80">{t.n}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-medium">风险编号</th>
              <th className="px-4 py-2.5 font-medium">分类</th>
              <th className="px-4 py-2.5 font-medium">等级</th>
              <th className="px-4 py-2.5 font-medium">来源单据</th>
              <th className="px-4 py-2.5 font-medium">说明</th>
              <th className="px-4 py-2.5 font-medium">处理人</th>
              <th className="px-4 py-2.5 font-medium">状态</th>
              <th className="px-4 py-2.5 font-medium">最近更新</th>
              <th className="px-4 py-2.5 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-3">{r.type}</td>
                <td className="px-4 py-3"><RiskBadge level={r.level} /></td>
                <td className="px-4 py-3 font-mono text-xs">{r.src}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.desc}</td>
                <td className="px-4 py-3">{r.owner}</td>
                <td className="px-4 py-3"><StatusBadge status={r.state} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.time}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-primary hover:underline">详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}