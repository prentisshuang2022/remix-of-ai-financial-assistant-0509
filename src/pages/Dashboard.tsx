import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  FileWarning,
  TrendingUp,
  PieChart,
  Check,
  X,
  UserCog,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const kpis = [
  { label: "今日 AI 处理量", value: "1,284", sub: "笔 · 较昨日 +12.4%", icon: Bot, accent: "text-info" },
  { label: "AI 自动通过率", value: "78.6%", sub: "节省人工 ≈ 5.2 工时", icon: CheckCircle2, accent: "text-success" },
  { label: "高风险待复核", value: "23", sub: "其中重复票据 7 张", icon: AlertTriangle, accent: "text-destructive" },
  { label: "今日待办", value: "46", sub: "12 项已超 4 小时", icon: Clock, accent: "text-warning" },
];

type Todo = {
  id: string;
  t: string;
  from: string;
  level: "高" | "中";
  time: string;
  summary: string;
  suggest: string;
  link: string;
};

const todos: Todo[] = [
  {
    id: "BX-2025-04-1083",
    t: "BX-2025-04-1083 报销单疑似重复，请复核",
    from: "费用报销",
    level: "高",
    time: "8分钟前",
    summary: "市场部王浩提交餐饮报销 ¥4,820，发票号尾号 881 与历史 BX-2025-03-0418 重复，且未附招待审批单。",
    suggest: "退回报销人，要求补充招待审批单与重复发票说明",
    link: "/expense/BX-2025-04-1083",
  },
  {
    id: "AP-20251205-022",
    t: "AP-20251205-022 应付链路缺少入库单",
    from: "应付追溯",
    level: "中",
    time: "32分钟前",
    summary: "供应商「华东精密」开票 ¥126,800，对应采购订单 PO-2025-0411 暂未匹配到入库单据。",
    suggest: "通知供应链补登入库单后再发起付款",
    link: "/payable",
  },
  {
    id: "AR-86420",
    t: "光电信保收款 ¥86,420 待人工确认入账科目",
    from: "应收助手",
    level: "中",
    time: "1小时前",
    summary: "银行流水显示对方付款方为「光电信保（深圳）」，AI 匹配到 2 个候选合同，置信度 72%。",
    suggest: "确认归属合同后入账「主营业务收入-光电模组」",
    link: "/receivable",
  },
  {
    id: "FRAUD-0042",
    t: "市场部 9 张餐费发票发票号尾号集中",
    from: "费用报销",
    level: "高",
    time: "3小时前",
    summary: "近 30 天市场部 9 张餐费发票尾号集中在 870–891 区间，符合「连号采购」风险特征。",
    suggest: "发起部门走查，要求市场部说明发票来源",
    link: "/risk",
  },
];

// 近 14 日 AI 处理量趋势（合并自统计分析）
const trend = [42, 58, 50, 67, 72, 65, 80, 88, 76, 92, 110, 98, 115, 124];
const risk = [
  { l: "低风险", v: 76, c: "text-success", bar: "bg-success" },
  { l: "中风险", v: 18, c: "text-warning", bar: "bg-warning" },
  { l: "高风险", v: 6, c: "text-destructive", bar: "bg-destructive" },
];

export default function Dashboard() {
  const [active, setActive] = useState<Todo | null>(null);

  const handleAction = (label: string) => {
    toast({ title: `已${label}`, description: active?.t });
    setActive(null);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-xl border border-border p-6 text-primary-foreground"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-xs">
              <Bot className="h-3.5 w-3.5" /> 财务AI员工 在岗
            </div>
            <h2 className="mt-3 text-2xl font-semibold">早上好，李婷婷。今天 AI 已为团队处理 1,284 笔财务事项</h2>
            <p className="mt-1.5 text-sm text-white/80">
              4 条业务闭环正常运行 · 23 项高风险待复核 · 已节省人工约 5.2 工时
            </p>
          </div>
          <Link
            to="/risk"
            className="hidden md:inline-flex items-center gap-1 rounded-md bg-white/15 px-3 py-2 text-sm hover:bg-white/25"
          >
            查看风险中心 <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <k.icon className={`h-4 w-4 ${k.accent}`} />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{k.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* 费用报销统计分析 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">费用报销 · 统计分析</h3>
          <Link to="/expense" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            进入费用报销 <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "本月报销单数", value: "1,062", sub: "环比 +8.3%", icon: TrendingUp, accent: "text-info" },
            { label: "本月报销金额", value: "¥3.42M", sub: "环比 +5.1%", icon: TrendingUp, accent: "text-primary" },
            { label: "AI 自动通过率", value: "78.6%", sub: "节省 5.2 工时/日", icon: CheckCircle2, accent: "text-success" },
            { label: "平均处理时长", value: "2.4h", sub: "较上月 -36%", icon: Clock, accent: "text-warning" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.accent}`} />
              </div>
              <div className="mt-2 text-xl font-semibold tabular-nums text-foreground">{k.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* 报销类型占比 */}
        <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">报销类型分布</h4>
            </div>
            <span className="text-[11px] text-muted-foreground">本月 · 按金额</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {[
              { l: "差旅费", v: 38, bar: "bg-primary" },
              { l: "业务招待", v: 24, bar: "bg-info" },
              { l: "办公采购", v: 18, bar: "bg-success" },
              { l: "市场费用", v: 12, bar: "bg-warning" },
              { l: "培训差补", v: 5, bar: "bg-accent" },
              { l: "其他", v: 3, bar: "bg-muted-foreground" },
            ].map((r) => (
              <div key={r.l}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{r.l}</span>
                  <span className="font-medium tabular-nums text-foreground">{r.v}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${r.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Todos + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">今日待办 · AI 已分发</h3>
            <Link to="/risk" className="text-xs text-primary hover:underline">全部 46 条 →</Link>
          </div>
          <ul className="divide-y divide-border">
            {todos.map((t, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                <FileWarning className={`h-4 w-4 shrink-0 ${t.level === "高" ? "text-destructive" : "text-warning"}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground truncate">{t.t}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    来源：{t.from} · {t.time}
                  </div>
                </div>
                <span
                  className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                    t.level === "高"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-warning/30 bg-warning-soft text-warning"
                  }`}
                >
                  {t.level}
                </span>
                <button
                  onClick={() => setActive(t)}
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted hover:border-primary hover:text-primary transition-colors"
                >
                  处理
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 风险分布（来自统计分析） */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">报销风险分布</h3>
            <span className="text-[11px] text-muted-foreground">本月</span>
          </div>
          <div className="space-y-3">
            {risk.map((r) => (
              <div key={r.l}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{r.l}</span>
                  <span className={`font-medium tabular-nums ${r.c}`}>{r.v}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${r.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 趋势图（来自统计分析，简约版） */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">近 14 日 AI 处理量趋势</h3>
          <div className="text-xs text-muted-foreground tabular-nums">
            合计 <span className="font-medium text-foreground">{trend.reduce((a, b) => a + b, 0).toLocaleString()}</span> 笔
          </div>
        </div>
        <div className="flex items-end gap-2 h-40">
          {trend.map((v, i) => {
            const max = Math.max(...trend);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary to-accent hover:opacity-80 transition-opacity"
                  style={{ height: `${(v / max) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground font-mono">{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 处理弹窗 */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                      active.level === "高"
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-warning/30 bg-warning-soft text-warning"
                    }`}
                  >
                    {active.level}风险
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">{active.id}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="text-foreground">{active.t}</div>
                <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
                  {active.summary}
                </div>
                <div className="rounded-md border border-info/30 bg-info-soft/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-info mb-1">
                    <Sparkles className="h-3.5 w-3.5" /> AI 建议
                  </div>
                  <div className="text-xs text-foreground">{active.suggest}</div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>来源：{active.from} · {active.time}</span>
                  <Link
                    to={active.link}
                    onClick={() => setActive(null)}
                    className="inline-flex items-center gap-0.5 text-primary hover:underline"
                  >
                    查看详情 <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <button
                  onClick={() => handleAction("转人工复核")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  <UserCog className="h-3.5 w-3.5" /> 转人工
                </button>
                <button
                  onClick={() => handleAction("退回")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-xs text-destructive-foreground hover:opacity-90"
                >
                  <X className="h-3.5 w-3.5" /> 退回
                </button>
                <button
                  onClick={() => handleAction("采纳 AI 建议")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-success px-3 py-2 text-xs text-success-foreground hover:opacity-90"
                >
                  <Check className="h-3.5 w-3.5" /> 采纳建议
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}