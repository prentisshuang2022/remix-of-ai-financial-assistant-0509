import { Search, Sparkles, Link2, Upload } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

const result = [
  { k: "客户名称", v: "Apex Industrial Co., Ltd." },
  { k: "客户国别", v: "美国 (US)" },
  { k: "销售结算币种", v: "USD" },
  { k: "销售订单号", v: "SO-20250308-1147" },
  { k: "采购订单号", v: "PO-20250320-0822" },
  { k: "采购入库单号", v: "RC-20250402-0319" },
  { k: "入库日期", v: "2025-04-02" },
  { k: "供应商", v: "宁波某某精密制造有限公司" },
  { k: "收料组织", v: "宁波制造中心" },
  { k: "采购组织", v: "总部采购中心" },
  { k: "应付单据编号", v: "AP-20250410-0561" },
  { k: "价税合计", v: "¥386,420.00" },
  { k: "结算组织", v: "总部财务" },
  { k: "付款组织", v: "总部财务" },
];

export default function Payable() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left — input */}
      <div className="lg:col-span-4 space-y-5">
        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-semibold">业务链路追溯</div>
            <StatusBadge status="已实现" />
          </div>
          <div className="p-4 space-y-4 text-sm">
            <p className="text-xs text-muted-foreground">
              输入发票号，或上传发票由 AI 自动识别，串联完整业务链路。
            </p>

            <div>
              <label className="text-xs text-muted-foreground">发票号</label>
              <input
                placeholder="如 04723881"
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>或</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="rounded-md border-2 border-dashed border-border bg-muted/40 p-4 text-center">
              <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
              <div className="mt-2 text-sm text-foreground">上传发票</div>
              <div className="mt-0.5 text-xs text-muted-foreground">支持 PDF · JPG · OFD · 自动识别发票内容</div>
              <button className="mt-3 rounded-md bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:opacity-90">
                选择文件
              </button>
            </div>

            <div className="rounded-md border border-border bg-background p-2.5 text-xs flex items-center justify-between">
              <span className="truncate">INV_04723881_宁波精密.pdf</span>
              <span className="text-success">已识别</span>
            </div>

            <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">
              <Search className="h-4 w-4" /> AI 追溯链路
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] text-xs text-muted-foreground">
          <div className="text-sm font-semibold text-foreground mb-2">最近查询</div>
          <ul className="space-y-1.5">
            <li className="flex justify-between"><span>发票 04723881</span><span>10分钟前</span></li>
            <li className="flex justify-between"><span>发票 04691205</span><span>2小时前</span></li>
            <li className="flex justify-between"><span>发票 04652788</span><span>昨天</span></li>
          </ul>
        </div>
      </div>

      {/* Right — result */}
      <div className="lg:col-span-8 space-y-5">
        <div className="rounded-xl border border-info/30 bg-info-soft/30 shadow-[var(--shadow-card)]">
          <div className="border-b border-info/20 px-4 py-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-info" />
            <span className="text-sm font-semibold">AI 追溯结果</span>
            <span className="ml-auto text-xs text-muted-foreground">命中链路 1 条 · 置信度 99.2%</span>
          </div>
          <div className="p-4">
            {/* Chain visual */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
              {["销售订单", "采购订单", "采购入库", "应付单", "结算"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="rounded-md border border-primary/30 bg-primary-soft px-2.5 py-1 text-primary font-medium">{s}</div>
                  {i < 4 && <Link2 className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {result.map((r) => (
                <div key={r.k} className="flex justify-between border-b border-border/50 py-2">
                  <dt className="text-muted-foreground">{r.k}</dt>
                  <dd className="text-foreground font-medium">{r.v}</dd>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-md border border-warning/30 bg-warning-soft/60 p-3 text-xs">
              <div className="font-medium text-warning mb-1">⚠ AI 提示</div>
              <div className="text-muted-foreground">
                结算组织与付款组织一致；销售币种 USD 与应付币种 CNY 不同，需确认结汇规则。建议链路已生成，可一键导出至 ERP 凭证草稿。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
