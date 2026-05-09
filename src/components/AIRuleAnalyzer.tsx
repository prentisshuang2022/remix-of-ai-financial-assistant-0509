import { useState } from "react";
import {
  Sparkles,
  Database,
  Download,
  Send,
  Loader2,
  Wand2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export type AnalyzerScenario = {
  /** 触发关键字（命中其中之一即返回该结果） */
  match: string[];
  /** 解析出的结构化规则展示 */
  parsed: { label: string; value: string }[];
  /** 表格列 */
  columns: string[];
  /** 表格行（与 columns 对齐） */
  rows: (string | number)[][];
  /** 数据来源说明 */
  source: string;
};

type Props = {
  /** 模块名称，例如 "费用报销" */
  module: string;
  /** 示例提示词（点击即可填入输入框） */
  examples: string[];
  /** 预置场景，命中关键字即返回；都未命中时返回 fallback */
  scenarios: AnalyzerScenario[];
  fallback: AnalyzerScenario;
};

export const AIRuleAnalyzer = ({ module, examples, scenarios, fallback }: Props) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzerScenario | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const run = () => {
    if (!prompt.trim()) {
      toast({ title: "请输入分析需求", description: "可参考下方示例描述你的规则。" });
      return;
    }
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const hit =
        scenarios.find((s) => s.match.some((m) => prompt.includes(m))) || fallback;
      setResult(hit);
      setLoading(false);
    }, 900);
  };

  const download = () => {
    if (!result) return;
    const csv = [
      result.columns.join(","),
      ...result.rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
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

  const sendDing = () => {
    toast({
      title: "已发送至钉钉",
      description: `「${module}」分析结果已推送到「财务部 · 工作群」`,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-[image:var(--gradient-hero)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[image:var(--gradient-brand)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Wand2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">AI 自定义分析 · {module}</div>
            <div className="text-[11px] text-muted-foreground">
              自然语言描述规则 → 自动从 ERP 取数 → 生成结果表
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
          {/* Input */}
          <div className="rounded-lg border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30 transition-all">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`用一句话描述你想分析什么，例如：${examples[0]}`}
              rows={2}
              className="w-full resize-none rounded-lg bg-transparent p-3 text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Database className="h-3 w-3" />
                数据来源：金蝶 ERP（自动取数 · 实时）
              </div>
              <button
                onClick={run}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 分析中…</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> 开始分析</>
                )}
              </button>
            </div>
          </div>

          {/* Examples */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">试试：</span>
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3 pt-1">
              {/* Parsed rule */}
              <div className="rounded-md border border-info/30 bg-info-soft/40 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-info mb-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> AI 已解析规则
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                  {result.parsed.map((p) => (
                    <div key={p.label} className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">{p.label}：</span>
                      <span className="text-foreground font-medium text-right truncate">{p.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground border-t border-info/20 pt-1.5">
                  数据范围：{result.source}
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border border-border overflow-hidden">
                <div className="flex items-center justify-between bg-muted/40 px-3 py-2">
                  <div className="text-xs font-medium text-foreground">
                    分析结果 · 共 {result.rows.length} 条
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIRuleAnalyzer;
