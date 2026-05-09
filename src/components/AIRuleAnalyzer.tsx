import { useMemo, useState } from "react";
import {
  Sparkles,
  Database,
  Download,
  Send,
  Loader2,
  Wand2,
  Settings2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

/* ---------- Types ---------- */

export type RuleType = "时间" | "筛选" | "分组" | "聚合" | "排序" | "限制";

export type RuleItem = {
  id: string;
  type: RuleType;
  field: string;
  op?: string;
  value: string;
};

export type AnalyzerScenario = {
  match: string[];
  rules: RuleItem[];
  columns: string[];
  rows: (string | number)[][];
  source: string;
};

type Props = {
  module: string;
  examples: string[];
  scenarios: AnalyzerScenario[];
  fallback: AnalyzerScenario;
  /** 该模块可用的字段（用于规则编辑下拉） */
  fieldOptions: string[];
};

/* ---------- Constants ---------- */

const RULE_TYPES: RuleType[] = ["时间", "筛选", "分组", "聚合", "排序", "限制"];

const OP_BY_TYPE: Record<RuleType, string[]> = {
  时间: ["="],
  筛选: [">", "≥", "<", "≤", "=", "≠", "包含", "不包含", "属于"],
  分组: ["按"],
  聚合: ["合计", "平均", "最大", "最小", "计数"],
  排序: ["降序", "升序"],
  限制: ["Top"],
};

const TYPE_TONE: Record<RuleType, string> = {
  时间: "border-info/30 bg-info-soft text-info",
  筛选: "border-primary/30 bg-primary-soft text-primary",
  分组: "border-accent/30 bg-accent/10 text-accent",
  聚合: "border-success/30 bg-success-soft text-success",
  排序: "border-warning/30 bg-warning-soft text-warning",
  限制: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- Component ---------- */

export const AIRuleAnalyzer = ({
  module,
  examples,
  scenarios,
  fallback,
  fieldOptions,
}: Props) => {
  const [rules, setRules] = useState<RuleItem[]>(fallback.rules);
  const [activeSource, setActiveSource] = useState(fallback.source);
  const [prompt, setPrompt] = useState("");
  const [parsing, setParsing] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    columns: string[];
    rows: (string | number)[][];
    source: string;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  /* ----- Rule mutations ----- */
  const addRule = (type: RuleType = "筛选") =>
    setRules((rs) => [
      ...rs,
      { id: uid(), type, field: fieldOptions[0] ?? "", op: OP_BY_TYPE[type][0], value: "" },
    ]);

  const updateRule = (id: string, patch: Partial<RuleItem>) =>
    setRules((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        if (patch.type && patch.type !== r.type) {
          next.op = OP_BY_TYPE[patch.type][0];
        }
        return next;
      })
    );

  const removeRule = (id: string) => setRules((rs) => rs.filter((r) => r.id !== id));
  const clearRules = () => setRules([]);

  /* ----- NL → rules ----- */
  const parseFromNL = () => {
    if (!prompt.trim()) {
      toast({ title: "请先输入分析需求" });
      return;
    }
    setParsing(true);
    setTimeout(() => {
      const hit = scenarios.find((s) => s.match.some((m) => prompt.includes(m))) || fallback;
      // 重新生成 id 以防重复
      setRules(hit.rules.map((r) => ({ ...r, id: uid() })));
      setActiveSource(hit.source);
      setParsing(false);
      toast({ title: "AI 已解析为规则", description: `共 ${hit.rules.length} 条，可在右侧继续编辑` });
    }, 700);
  };

  /* ----- Run analysis ----- */
  const run = () => {
    if (rules.length === 0) {
      toast({ title: "请先配置至少一条规则" });
      setDrawerOpen(true);
      return;
    }
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      // 用 prompt 或当前规则关键字匹配最接近的场景作为模拟数据源
      const text = prompt + " " + rules.map((r) => `${r.field}${r.op ?? ""}${r.value}`).join(" ");
      const hit = scenarios.find((s) => s.match.some((m) => text.includes(m))) || fallback;
      setResult({ columns: hit.columns, rows: hit.rows, source: activeSource || hit.source });
      setRunning(false);
    }, 900);
  };

  /* ----- Export ----- */
  const download = () => {
    if (!result) return;
    const csv = [
      result.columns.join(","),
      ...result.rows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module}-AI分析-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "已开始下载", description: "CSV 文件已生成" });
  };

  const sendDing = () =>
    toast({
      title: "已发送至钉钉",
      description: `「${module}」分析结果已推送到「财务部 · 工作群」`,
    });

  /* ----- Summary chips ----- */
  const summary = useMemo(() => {
    if (rules.length === 0) return null;
    return rules.map((r) => {
      const text = [r.field, r.op, r.value].filter(Boolean).join(" ");
      return { id: r.id, type: r.type, text };
    });
  }, [rules]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-[image:var(--gradient-hero)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[image:var(--gradient-brand)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Wand2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">AI 自定义分析 · {module}</div>
            <div className="text-[11px] text-muted-foreground">
              自然语言 → 结构化规则 → ERP 取数 → 结果表
            </div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          {/* Data source */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="inline-flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              数据来源：金蝶 ERP（自动取数 · 实时）
            </div>
          </div>

          {/* Current rules summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">当前规则</span>
                <span className="text-muted-foreground">· 共 {rules.length} 条</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] hover:border-primary hover:text-primary transition-colors"
                >
                  <Settings2 className="h-3 w-3" /> 配置规则
                </button>
                <button
                  onClick={run}
                  disabled={running}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {running ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> 取数中…</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> 取数并生成结果</>
                  )}
                </button>
              </div>
            </div>
            {summary && summary.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {summary.map((s) => (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${TYPE_TONE[s.type]}`}
                  >
                    <span className="font-medium">{s.type}</span>
                    <span className="text-foreground/80">· {s.text || "（未配置）"}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground italic">
                暂无规则，点击右上「配置规则」或在上方输入需求让 AI 自动生成。
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="rounded-md border border-border overflow-hidden">
              <div className="flex items-center justify-between bg-muted/40 px-3 py-2">
                <div className="text-xs">
                  <span className="font-medium text-foreground">分析结果</span>
                  <span className="text-muted-foreground"> · 共 {result.rows.length} 条 · </span>
                  <span className="text-muted-foreground">{result.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={download}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] hover:border-primary hover:text-primary transition-colors"
                  >
                    <Download className="h-3 w-3" /> 下载 CSV
                  </button>
                  <button
                    onClick={sendDing}
                    className="inline-flex items-center gap-1 rounded-md bg-[#1989FA] px-2.5 py-1 text-[11px] text-white hover:opacity-90"
                  >
                    <Send className="h-3 w-3" /> 发送至钉钉
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 text-muted-foreground sticky top-0">
                    <tr>
                      {result.columns.map((c, i) => (
                        <th
                          key={c}
                          className={`px-3 py-2 font-medium ${i === 0 ? "text-left" : "text-right"}`}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-muted/40">
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={`px-3 py-2 ${
                              ci === 0
                                ? "text-foreground"
                                : "text-right tabular-nums text-foreground"
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drawer: 规则配置 */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4 text-primary" /> 规则配置 · {module}
            </SheetTitle>
            <SheetDescription className="text-xs">
              支持多条规则组合。每条规则可单独编辑、增删，最终按顺序作用于 ERP 取数。
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* 顶部 NL 快速生成 */}
            <div className="rounded-lg border border-info/30 bg-info-soft/30 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-info mb-2">
                <Sparkles className="h-3.5 w-3.5" /> 用自然语言快速生成
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`例如：${examples[0]}`}
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <button
                onClick={parseFromNL}
                disabled={parsing}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-info px-3 py-1.5 text-xs text-info-foreground hover:opacity-90 disabled:opacity-60"
              >
                {parsing ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 解析中…</>
                ) : (
                  <><Wand2 className="h-3.5 w-3.5" /> AI 解析覆盖当前规则</>
                )}
              </button>
            </div>

            {/* Rule list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-foreground">规则列表（{rules.length}）</div>
                {rules.length > 0 && (
                  <button
                    onClick={clearRules}
                    className="text-[11px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> 清空全部
                  </button>
                )}
              </div>

              {rules.length === 0 && (
                <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
                  暂无规则，点击下方「添加规则」开始配置
                </div>
              )}

              {rules.map((r, idx) => (
                <div
                  key={r.id}
                  className="rounded-md border border-border bg-background p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                        {idx + 1}
                      </span>
                      <Select
                        value={r.type}
                        onValueChange={(v) => updateRule(r.id, { type: v as RuleType })}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RULE_TYPES.map((t) => (
                            <SelectItem key={t} value={t} className="text-xs">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      onClick={() => removeRule(r.id)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    {/* Field */}
                    <div className="col-span-5">
                      <Select
                        value={r.field || undefined}
                        onValueChange={(v) => updateRule(r.id, { field: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="选择字段" />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldOptions.map((f) => (
                            <SelectItem key={f} value={f} className="text-xs">
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Op */}
                    <div className="col-span-3">
                      <Select
                        value={r.op || undefined}
                        onValueChange={(v) => updateRule(r.id, { op: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OP_BY_TYPE[r.type].map((o) => (
                            <SelectItem key={o} value={o} className="text-xs">
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Value */}
                    <div className="col-span-4">
                      <input
                        value={r.value}
                        onChange={(e) => updateRule(r.id, { value: e.target.value })}
                        placeholder="值"
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {RULE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => addRule(t)}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:border-primary hover:text-primary transition-colors ${TYPE_TONE[t]}`}
                  >
                    <Plus className="h-3 w-3" /> {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border px-5 py-3">
            <div className="flex w-full items-center justify-between">
              <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" /> 修改实时生效
              </div>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  run();
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground hover:opacity-90"
              >
                <Sparkles className="h-3.5 w-3.5" /> 应用并取数
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AIRuleAnalyzer;
