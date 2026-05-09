import { Upload, Sparkles, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { AIRuleAnalyzer, type AnalyzerScenario } from "@/components/AIRuleAnalyzer";

const ANALYZER_EXAMPLES = [
  "本月应收账龄 60 天以上的客户 Top 10",
  "近 90 天回款率低于 60% 的销售员",
  "外币收款按币种汇总当前敞口",
  "本季度信保理赔 / 保费比",
];

const ANALYZER_SCENARIOS: AnalyzerScenario[] = [
  {
    match: ["账龄", "60", "Top"],
    parsed: [
      { label: "时间范围", value: "截至今日" },
      { label: "条件", value: "应收账龄 > 60 天" },
      { label: "分组", value: "客户" },
      { label: "排序", value: "应收余额降序" },
      { label: "限制", value: "Top 10" },
    ],
    columns: ["客户", "未收单数", "应收余额", "最长账龄(天)", "归属销售"],
    rows: [
      ["Apex Industrial Co., Ltd.", 4, "¥586,420", 92, "周文"],
      ["Bright Optics GmbH", 3, "¥420,800", 86, "李珂"],
      ["Sunrise Photonics Ltd.", 5, "¥362,150", 78, "周文"],
      ["Helix Sensor Inc.", 2, "¥298,600", 74, "高翔"],
      ["NovaTech AS", 3, "¥256,400", 71, "李珂"],
      ["Polaris Trading", 1, "¥210,000", 68, "陈鹏"],
      ["Eastern Robotics", 4, "¥186,200", 66, "高翔"],
      ["Nordic Lasers AB", 2, "¥162,800", 64, "李珂"],
      ["BlueWave Devices", 3, "¥142,000", 63, "周文"],
      ["Atlas Components", 1, "¥118,500", 61, "陈鹏"],
    ],
    source: "金蝶 ERP · 应收单 + 客户主数据 · 实时（共 26 户）",
  },
];

const ANALYZER_FALLBACK: AnalyzerScenario = {
  match: [],
  parsed: [
    { label: "时间范围", value: "截至今日" },
    { label: "维度", value: "账龄区间" },
    { label: "聚合", value: "应收余额、客户数" },
  ],
  columns: ["账龄区间", "客户数", "应收余额", "占比"],
  rows: [
    ["0-30 天", 42, "¥4,820,000", "48.2%"],
    ["30-60 天", 28, "¥2,640,000", "26.4%"],
    ["60-90 天", 16, "¥1,280,000", "12.8%"],
    [">90 天", 12, "¥1,260,000", "12.6%"],
  ],
  source: "金蝶 ERP · 应收单 · 实时（共 98 户）",
};

const entries = [
  { acct: "应收账款 — Apex Industrial", debit: "", credit: "¥86,420.00", note: "冲减客户 Apex 应收余额" },
  { acct: "财务费用 — 信保手续费", debit: "¥420.00", credit: "", note: "费率 0.486% · 平安产险" },
  { acct: "银行存款 — 招商银行 USD", debit: "¥86,000.00", credit: "", note: "汇率 7.1820 · 中行中间价" },
];

export default function Receivable() {
  return (
    <div className="space-y-5">
      <AIRuleAnalyzer
        module="应收"
        examples={ANALYZER_EXAMPLES}
        scenarios={ANALYZER_SCENARIOS}
        fallback={ANALYZER_FALLBACK}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left input */}
      <div className="lg:col-span-4 space-y-5">
        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-semibold">光电信保收款核对</div>
            <StatusBadge status="部分实现" />
          </div>
          <div className="p-4 space-y-3 text-sm">
            {/* Upload */}
            <div className="rounded-md border-2 border-dashed border-border bg-muted/40 p-4 text-center">
              <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
              <div className="mt-2 text-sm text-foreground">上传银行回单 / 收款流水</div>
              <div className="mt-0.5 text-xs text-muted-foreground">支持 PDF · JPG · OFD</div>
              <button className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90">
                选择文件
              </button>
            </div>

            <div className="rounded-md border border-border bg-background p-2.5 text-xs flex items-center justify-between">
              <span className="truncate">SWIFT_20250412_AP3017.pdf</span>
              <span className="text-success">已识别</span>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">客户名称（可选）</label>
              <input
                defaultValue="Apex Industrial Co., Ltd."
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">收款日期</label>
              <input
                defaultValue="2025-04-12"
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">
              <Sparkles className="h-4 w-4" /> 生成入账建议
            </button>
          </div>
        </div>
      </div>

      {/* Right result */}
      <div className="lg:col-span-8 space-y-5">
        <div className="rounded-xl border border-info/30 bg-info-soft/30 shadow-[var(--shadow-card)]">
          <div className="border-b border-info/20 px-4 py-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-info" />
            <span className="text-sm font-semibold">AI 识别结果</span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
              ✓ 已识别为光电信保收款
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { k: "收款金额（USD）", v: "$12,000.00" },
              { k: "汇率（中行中间价）", v: "7.1820" },
              { k: "折人民币", v: "¥86,184.00" },
              { k: "信保手续费率", v: "0.486%" },
              { k: "保单号", v: "PA-EXP-2025-0317" },
              { k: "承保方", v: "平安产险" },
              { k: "对应客户", v: "Apex Industrial" },
              { k: "是否推送 ERP", v: "待人工确认" },
            ].map((r) => (
              <div key={r.k}>
                <div className="text-xs text-muted-foreground">{r.k}</div>
                <div className="mt-0.5 text-foreground font-medium">{r.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-semibold">入账建议（3 条）</div>
            <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              推送至 ERP <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-medium">科目</th>
                <th className="px-4 py-2.5 font-medium text-right">借方</th>
                <th className="px-4 py-2.5 font-medium text-right">贷方</th>
                <th className="px-4 py-2.5 font-medium">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-foreground">{e.acct}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{e.debit || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{e.credit || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.note}</td>
                </tr>
              ))}
              <tr className="bg-muted/40">
                <td className="px-4 py-2.5 text-xs text-muted-foreground">合计</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold">¥86,420.00</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold">¥86,420.00</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}