import { cn } from "@/lib/utils";

type Status =
  | "已接入"
  | "已实现"
  | "部分实现"
  | "规划中"
  | "待人工确认"
  | "已通过"
  | "已退回"
  | "处理中"
  | "已完成"
  | "异常";

const styles: Record<Status, string> = {
  已接入: "bg-info-soft text-info border-info/20",
  已实现: "bg-success-soft text-success border-success/20",
  部分实现: "bg-warning-soft text-warning border-warning/20",
  规划中: "bg-muted text-muted-foreground border-border",
  待人工确认: "bg-warning-soft text-warning border-warning/30",
  已通过: "bg-success-soft text-success border-success/20",
  已退回: "bg-destructive/10 text-destructive border-destructive/20",
  处理中: "bg-info-soft text-info border-info/20",
  已完成: "bg-success-soft text-success border-success/20",
  异常: "bg-destructive/10 text-destructive border-destructive/20",
};

export const StatusBadge = ({ status, className }: { status: Status; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
      styles[status],
      className
    )}
  >
    {status}
  </span>
);

export const RiskBadge = ({ level }: { level: "高" | "中" | "低" }) => {
  const map = {
    高: "bg-risk-high/10 text-risk-high border-risk-high/30",
    中: "bg-risk-mid/10 text-risk-mid border-risk-mid/30",
    低: "bg-risk-low/10 text-risk-low border-risk-low/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        map[level]
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          level === "高" && "bg-risk-high",
          level === "中" && "bg-risk-mid",
          level === "低" && "bg-risk-low"
        )}
      />
      {level}风险
    </span>
  );
};