import { Link, useParams } from "react-router-dom";
import { ChevronLeft, FileText, Sparkles, ShieldAlert, Check, X, UserCog, ShieldCheck, Trophy, RefreshCw } from "lucide-react";
import { RiskBadge, StatusBadge } from "@/components/StatusBadge";

const ocr = [
  { k: "发票号码", v: "04723881" },
  { k: "发票代码", v: "3300204130" },
  { k: "开票日期", v: "2025-04-12" },
  { k: "销售方", v: "杭州某某餐饮有限公司" },
  { k: "金额（不含税）", v: "¥4,547.17" },
  { k: "税额", v: "¥272.83" },
  { k: "价税合计", v: "¥4,820.00" },
  { k: "OCR 置信度", v: "98.4%" },
];

const rules = [
  { no: 1, rule: "数量 × 单价 = 金额", desc: "行项目金额一致性", hit: false, detail: "12 行全部通过" },
  { no: 2, rule: "金额 + 税额 = 价税合计", desc: "含税金额核对", hit: false, detail: "通过（差异 ¥0.00）" },
  { no: 3, rule: "价税合计 × 税率 ≈ 税额", desc: "税额计算核对（允许误差）", hit: false, detail: "通过（误差 ¥0.01，在容差内）" },
  { no: 4, rule: "价税合计中文大写 = 数字小写", desc: "大小写一致性", hit: false, detail: "肆仟捌佰贰拾元整 = ¥4,820.00" },
  { no: 5, rule: "所有项目金额累加 = 合计金额", desc: "多行汇总核对", hit: true, detail: "明细累加 ¥4,540.00 ≠ 合计 ¥4,547.17" },
  { no: 6, rule: "所有项目税额累加 = 合计税额", desc: "税额汇总核对", hit: false, detail: "通过" },
];

const dup = [
  { id: "BX-2025-03-0418", date: "2025-03-21", amount: "¥820", note: "同发票号尾号 881，疑似重复" },
];

export default function ExpenseDetail() {
  const { id } = useParams();
  return (
    <div className="space-y-5">
      <Link to="/expense" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> 返回报销看板
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> 报销单
            </div>
            <h2 className="mt-1 text-xl font-semibold text-foreground font-mono">{id || "BX-2025-04-1083"}</h2>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1.5 text-sm">
              <div><span className="text-muted-foreground">提交人：</span>王浩 / 市场部</div>
              <div><span className="text-muted-foreground">报销类型：</span>客户招待</div>
              <div><span className="text-muted-foreground">提交时间：</span>2025-04-12 09:22</div>
              <div><span className="text-muted-foreground">总金额：</span><span className="tabular-nums font-medium">¥4,820.00</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge level="高" />
            <StatusBadge status="待人工确认" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">
          {/* Invoice preview + OCR */}
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">发票预览 · OCR 识别</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="border-r border-border bg-muted/40 p-4">
                <div className="aspect-[4/3] rounded-md border border-dashed border-border bg-card flex flex-col items-center justify-center text-xs text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-40" />
                  发票图片预览（6 张）
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className={`h-1.5 w-6 rounded-full ${i === 1 ? "bg-primary" : "bg-border"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-2">发票 1 / 6 · 餐饮专票</div>
                <dl className="space-y-2 text-sm">
                  {ocr.map((o) => (
                    <div key={o.k} className="flex justify-between border-b border-border/60 pb-1.5">
                      <dt className="text-muted-foreground">{o.k}</dt>
                      <dd className="text-foreground tabular-nums">{o.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          {/* Rule checks */}
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="text-sm font-semibold">规则校验明细</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success" />通过 {rules.filter(r => !r.hit).length}</span>
                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-destructive" />命中 {rules.filter(r => r.hit).length}</span>
              </div>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-primary text-primary-foreground text-xs">
                  <tr className="text-left">
                    <th className="w-12 px-3 py-2.5 font-medium text-center">序号</th>
                    <th className="px-3 py-2.5 font-medium">校验规则</th>
                    <th className="px-3 py-2.5 font-medium">说明</th>
                    <th className="w-20 px-3 py-2.5 font-medium text-center">结果</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r, i) => (
                    <tr key={r.no} className={i % 2 === 1 ? "bg-success-soft/40" : ""}>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 text-[11px] font-medium text-primary tabular-nums">
                          {r.no}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-foreground">{r.rule}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        <div>{r.desc}</div>
                        <div className={`text-[11px] mt-0.5 ${r.hit ? "text-destructive" : "text-muted-foreground/80"}`}>{r.detail}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {r.hit ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[11px] text-destructive">
                            <X className="h-3 w-3" />命中
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-md border border-success/30 bg-success-soft px-1.5 py-0.5 text-[11px] text-success">
                            <Check className="h-3 w-3" />通过
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 容错机制 + 验证成果 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border-t border-border bg-muted/20">
              <div className="rounded-lg border border-info/30 bg-card p-3">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
                  <ShieldCheck className="h-4 w-4 text-info" /> 容错机制
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex gap-1.5">
                    <RefreshCw className="h-3 w-3 mt-0.5 text-info shrink-0" />
                    <span>校验不通过 → 自动重试最多 <span className="font-medium text-foreground">3 次</span>（应对 OCR 偶发误差）</span>
                  </li>
                  <li className="flex gap-1.5">
                    <UserCog className="h-3 w-3 mt-0.5 text-info shrink-0" />
                    <span>3 次仍失败 → 标记为 <span className="font-medium text-foreground">人工复核</span>，不输出最终值</span>
                  </li>
                  <li className="flex gap-1.5">
                    <Check className="h-3 w-3 mt-0.5 text-info shrink-0" />
                    <span>充分考虑小数点后两位四舍五入的法定误差</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-success/30 bg-card p-3">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
                  <Trophy className="h-4 w-4 text-success" /> 三项验证成果
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex gap-1.5"><Check className="h-3 w-3 mt-0.5 text-success shrink-0" /><span>发票关键信息高精度提取</span></li>
                  <li className="flex gap-1.5"><Check className="h-3 w-3 mt-0.5 text-success shrink-0" /><span>双引擎 + 算术校验确保数据准确性</span></li>
                  <li className="flex gap-1.5"><Check className="h-3 w-3 mt-0.5 text-success shrink-0" /><span>建立自动化与人工复核的合理分界线</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Duplicate check */}
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">票据查重结果</div>
            <div className="px-4 py-3 text-sm">
              <div className="mb-3 flex items-center gap-2 text-warning">
                <ShieldAlert className="h-4 w-4" /> 检测到 1 张疑似重复票据
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="text-left border-b border-border">
                    <th className="py-2 font-medium">关联报销单</th>
                    <th className="py-2 font-medium">日期</th>
                    <th className="py-2 font-medium">金额</th>
                    <th className="py-2 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {dup.map((d) => (
                    <tr key={d.id} className="border-b border-border/60">
                      <td className="py-2 font-mono text-xs">{d.id}</td>
                      <td className="py-2">{d.date}</td>
                      <td className="py-2 tabular-nums">{d.amount}</td>
                      <td className="py-2 text-muted-foreground">{d.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right col — AI panel */}
        <div className="space-y-5">
          <div className="rounded-xl border border-info/30 bg-info-soft/40 shadow-[var(--shadow-card)]">
            <div className="border-b border-info/20 px-4 py-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-info" />
              <span className="text-sm font-semibold text-foreground">AI 审批结论</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs text-muted-foreground">建议</div>
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-destructive px-2.5 py-1 text-sm font-medium text-destructive-foreground">
                  <X className="h-3.5 w-3.5" /> 退回报销人
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">风险评分</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl font-semibold text-destructive tabular-nums">87</span>
                  <span className="text-xs text-muted-foreground">/ 100 · 高风险阈值 ≥ 70</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">证据链</div>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex gap-1.5"><span className="text-destructive">●</span><span>单笔金额 ¥4,820 超出餐费限额 ¥2,000</span></li>
                  <li className="flex gap-1.5"><span className="text-destructive">●</span><span>未附招待审批单（&gt;¥3,000 必填）</span></li>
                  <li className="flex gap-1.5"><span className="text-warning">●</span><span>1 张发票号尾号与历史 BX-2025-03-0418 重复</span></li>
                  <li className="flex gap-1.5"><span className="text-muted-foreground">●</span><span>该员工近 30 天报销 8 次，处于部门 P85 分位</span></li>
                </ul>
              </div>
              <div className="rounded-md bg-card border border-border p-3 text-xs text-muted-foreground">
                AI 摘要：本报销单触发 2 条强校验规则，并存在票据重复疑点，建议退回补充招待审批单与重复发票说明后重新提交。
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] space-y-2">
            <div className="text-sm font-semibold mb-1">下一步动作</div>
            <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-success px-3 py-2 text-sm text-success-foreground hover:opacity-90">
              <Check className="h-4 w-4" /> 通过
            </button>
            <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:opacity-90">
              <X className="h-4 w-4" /> 退回（采纳 AI 建议）
            </button>
            <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted">
              <UserCog className="h-4 w-4" /> 转人工复核
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}