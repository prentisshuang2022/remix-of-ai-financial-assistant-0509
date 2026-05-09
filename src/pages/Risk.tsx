import { AlertTriangle } from "lucide-react";
import { RiskBadge, StatusBadge } from "@/components/StatusBadge";

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