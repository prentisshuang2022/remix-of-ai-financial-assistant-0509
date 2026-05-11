# 后端实现规范（Backend Spec）

本文档为研发提供「能直接据此生成后端代码」的完整规范，目标实现栈：**Lovable Cloud（Supabase）+ Edge Functions（Deno / TypeScript）**。其他 Node/Java 实现亦可参照。

---

## 0. 总览

```text
                ┌────────────────────────────────────────┐
   Web App ───▶ │  Edge Functions  (Deno + Hono)         │
                │   ├─ /api/expense/*                    │
                │   ├─ /api/payable/*                    │
                │   ├─ /api/receivable/*                 │
                │   ├─ /api/risk/*                       │
                │   └─ /api/ai/*                         │
                └────────┬──────────────┬────────────────┘
                         │              │
                  ┌──────▼──────┐  ┌────▼────────────┐
                  │ Postgres    │  │ 外部系统         │
                  │  + RLS      │  │  · 金蝶 ERP      │
                  │  + pgcrypto │  │  · 钉钉机器人     │
                  │  + pg_cron  │  │  · LLM (OpenAI) │
                  └─────────────┘  └─────────────────┘
```

---

## 1. 环境变量 / Secrets

| 名称 | 用途 | 示例 | 必填 |
| --- | --- | --- | --- |
| `SUPABASE_URL` | 平台注入 | `https://xxx.supabase.co` | ✅ |
| `SUPABASE_ANON_KEY` | 平台注入 | — | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function 内部使用 | — | ✅ |
| `KINGDEE_BASE_URL` | 金蝶 ERP API 网关 | `https://erp.example.com/k3cloud` | ✅ |
| `KINGDEE_APP_ID` | 应用 ID | — | ✅ |
| `KINGDEE_APP_SECRET` | 应用密钥 | — | ✅ |
| `KINGDEE_USER` | 接口账号 | `api_user` | ✅ |
| `KINGDEE_DBID` | 账套 ID | `624...001` | ✅ |
| `DINGTALK_WEBHOOK_DEFAULT` | 默认机器人 webhook | `https://oapi.dingtalk.com/robot/send?access_token=...` | ✅ |
| `DINGTALK_SIGN_SECRET` | 加签密钥 | — | ✅ |
| `OPENAI_API_KEY` | LLM 调用 | — | ✅ |
| `OPENAI_MODEL` | 模型 | `gpt-4o-mini` | 否 |
| `LOG_LEVEL` | 日志等级 | `info` | 否 |

> 通过 `secrets--add_secret` 工具录入；切勿写入 git。

---

## 2. 数据库 Schema（Postgres DDL）

> 全部表启用 RLS。金额统一 `numeric(18,2)`，时间统一 `timestamptz`。

### 2.1 枚举

```sql
create type app_role         as enum ('admin', 'finance', 'auditor', 'viewer');
create type risk_level       as enum ('high', 'mid', 'low');
create type expense_status   as enum ('pending', 'manual_review', 'approved', 'rejected', 'processing');
create type ai_suggest       as enum ('approve', 'reject', 'manual');
create type payable_status   as enum ('open', 'planned', 'paid', 'overdue');
create type receivable_status as enum ('open', 'partial', 'closed', 'overdue');
create type risk_event_status as enum ('open', 'ack', 'closed', 'escalated');
create type rule_type        as enum ('time', 'filter', 'group', 'agg', 'sort', 'limit');
```

### 2.2 用户与角色

```sql
-- profiles 1:1 镜像 auth.users（业务字段）
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  dept         text,
  created_at   timestamptz not null default now()
);

create table public.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
```

### 2.3 业务表

```sql
-- 报销
create table public.expense (
  id            text primary key,                  -- BX-2025-04-1083
  user_id       uuid references auth.users(id),
  user_name     text not null,
  dept          text not null,
  amount        numeric(18,2) not null,
  invoice_count int not null default 0,
  rule_hit      int not null default 0,
  dup_count     int not null default 0,
  risk          risk_level not null default 'low',
  ai_suggest    ai_suggest,
  ai_note       text,
  status        expense_status not null default 'pending',
  occurred_on   date not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index expense_dept_date_idx on public.expense (dept, occurred_on desc);
create index expense_risk_idx       on public.expense (risk);

create table public.expense_item (
  id          uuid primary key default gen_random_uuid(),
  expense_id  text not null references public.expense(id) on delete cascade,
  category    text not null,           -- 餐费/差旅/办公...
  amount      numeric(18,2) not null,
  invoice_no  text,
  ocr_score   numeric(5,4),
  meta        jsonb default '{}'::jsonb
);

-- 应付
create table public.payable (
  id           text primary key,         -- AP-2025-04-001
  supplier     text not null,
  amount       numeric(18,2) not null,
  due_date     date not null,
  aging_days   int generated always as (greatest(0, (current_date - due_date))) stored,
  status       payable_status not null default 'open',
  pay_plan_id  uuid,
  created_at   timestamptz not null default now()
);
create index payable_supplier_idx on public.payable (supplier);
create index payable_aging_idx    on public.payable (aging_days);

create table public.payment_plan (
  id        uuid primary key default gen_random_uuid(),
  pay_date  date not null,
  channel   text not null,             -- 网银/票据/现金
  total     numeric(18,2) not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 应收
create table public.receivable (
  id          text primary key,
  customer    text not null,
  amount      numeric(18,2) not null,
  due_date    date not null,
  aging_days  int generated always as (greatest(0, (current_date - due_date))) stored,
  status      receivable_status not null default 'open',
  created_at  timestamptz not null default now()
);
create index receivable_customer_idx on public.receivable (customer);

-- 风险事件
create table public.risk_event (
  id         uuid primary key default gen_random_uuid(),
  module     text not null,            -- expense/payable/receivable
  ref_id     text,                     -- 关联业务 id
  level      risk_level not null,
  title      text not null,
  detail     jsonb default '{}'::jsonb,
  status     risk_event_status not null default 'open',
  occurred_at timestamptz not null default now(),
  handled_by uuid references auth.users(id),
  handled_at timestamptz
);
create index risk_event_level_status_idx on public.risk_event (level, status);

-- AI 分析任务（记录 prompt/规则/结果，便于审计与复跑）
create table public.ai_analysis (
  id            uuid primary key default gen_random_uuid(),
  module        text not null,
  prompt        text,
  rules         jsonb not null,        -- RuleItem[]
  columns       jsonb,
  rows          jsonb,
  source        text,
  row_count     int,
  duration_ms   int,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
create index ai_analysis_user_idx on public.ai_analysis (created_by, created_at desc);

-- ERP 同步水位
create table public.erp_sync_state (
  module       text primary key,        -- expense/payable/receivable
  last_synced_at timestamptz not null default 'epoch',
  cursor       text
);

-- 钉钉推送日志
create table public.dingtalk_log (
  id          uuid primary key default gen_random_uuid(),
  module      text,
  group_id    text,
  payload     jsonb,
  status      text,                    -- ok/failed
  error       text,
  created_at  timestamptz not null default now()
);

-- updated_at 触发器
create or replace function public.tg_set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger expense_set_updated before update on public.expense
  for each row execute function public.tg_set_updated_at();
```

### 2.4 RLS 策略

```sql
alter table public.profiles      enable row level security;
alter table public.user_roles    enable row level security;
alter table public.expense       enable row level security;
alter table public.expense_item  enable row level security;
alter table public.payable       enable row level security;
alter table public.payment_plan  enable row level security;
alter table public.receivable    enable row level security;
alter table public.risk_event    enable row level security;
alter table public.ai_analysis   enable row level security;

-- profiles：本人可读写，admin 可读
create policy "self read profile"  on public.profiles for select using (auth.uid() = id);
create policy "self write profile" on public.profiles for update using (auth.uid() = id);
create policy "admin read profiles" on public.profiles for select using (public.has_role(auth.uid(), 'admin'));

-- user_roles：仅 admin 可写读
create policy "admin manage roles" on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 业务表读：finance / auditor / admin 可读
create policy "finance read expense" on public.expense for select using (
  public.has_role(auth.uid(),'finance') or public.has_role(auth.uid(),'auditor') or public.has_role(auth.uid(),'admin')
);
create policy "finance write expense" on public.expense for update using (
  public.has_role(auth.uid(),'finance') or public.has_role(auth.uid(),'admin')
);
-- payable / receivable / risk_event / ai_analysis 同模板

-- ai_analysis：本人可读自己的，admin 全可读
create policy "own ai analysis" on public.ai_analysis for select using (created_by = auth.uid());
create policy "insert ai analysis" on public.ai_analysis for insert with check (created_by = auth.uid());
```

### 2.5 种子数据（开发环境）

放置 `supabase/seed.sql`，与 `src/pages/Expense.tsx` 中的 mock `rows` 保持一一对应，便于前后端联调。

---

## 3. Edge Function 规范

> 每个 Function 一个目录：`supabase/functions/<name>/index.ts`。统一使用 Hono 路由 + Zod 校验。

### 3.1 通用骨架

```ts
// supabase/functions/_shared/server.ts
import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";

export function createApp() {
  const app = new Hono();
  app.use("*", cors({ origin: "*", allowHeaders: ["authorization","content-type"] }));
  app.use("*", async (c, next) => {
    const auth = c.req.header("authorization");
    if (!auth) return c.json({ code: 4010, message: "unauthorized" }, 401);
    c.set("supabase", createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    ));
    await next();
  });
  return app;
}
export const ok   = (data: unknown) => ({ code: 0, message: "ok", data });
export const fail = (code: number, message: string) => ({ code, message });
```

### 3.2 函数清单

| Function | 路径 | 说明 |
| --- | --- | --- |
| `expense-api` | `/expense/*` | 列表/详情/动作 |
| `payable-api` | `/payable/*` | 列表/付款计划 |
| `receivable-api` | `/receivable/*` | 列表/预测 |
| `risk-api` | `/risk/*` | 事件列表与处置 |
| `ai-parse-rules` | `/ai/parse-rules` | LLM 解析自然语言 → RuleItem[] |
| `ai-run` | `/ai/run` | 规则编译为 SQL 并执行 |
| `ai-export` | `/ai/export` | 结果导出 CSV |
| `ai-notify-dingtalk` | `/ai/notify/dingtalk` | 钉钉推送 |
| `erp-sync` | （cron）每 5 分钟 | 拉取金蝶最新单据 |

### 3.3 Zod Schema（请求体）

```ts
import { z } from "npm:zod@3";

export const RuleItemZ = z.object({
  id: z.string(),
  type: z.enum(["time","filter","group","agg","sort","limit"]),
  field: z.string(),
  op: z.string().optional(),
  value: z.string(),
});

export const ParseRulesReq = z.object({
  module: z.enum(["expense","payable","receivable","risk"]),
  prompt: z.string().min(1).max(500),
  fieldOptions: z.array(z.string()).min(1),
});

export const RunReq = z.object({
  module: z.enum(["expense","payable","receivable","risk"]),
  rules: z.array(RuleItemZ).min(1).max(20),
  format: z.enum(["table","csv"]).default("table"),
});

export const NotifyReq = z.object({
  module: z.string(),
  title: z.string().max(80),
  result: z.object({ columns: z.array(z.string()), rows: z.array(z.array(z.union([z.string(), z.number()]))) }),
  groupId: z.string().optional(),
  atMobiles: z.array(z.string()).optional(),
});
```

### 3.4 错误与日志约定

- 所有响应使用 §1 错误码包络。
- 抛错经统一中间件捕获 → `console.error(JSON.stringify({lvl:'error', fn, err}))`。
- 重要操作（审批、付款计划、钉钉推送）写入 `audit_log`（可后续补表）。
- 限流：同 user 同 endpoint 60 次/分钟，超出返回 4290。

---

## 4. AI 模块（核心）

### 4.1 自然语言 → RuleItem[]

**System Prompt**（`/ai-parse-rules`）：

```text
你是企业财务系统的「规则解析器」。将用户的中文需求转为 JSON 数组 RuleItem[]。
规则：
- 仅输出 JSON，不要解释。
- type ∈ [time, filter, group, agg, sort, limit]
- 执行顺序固定：time → filter → group → agg → sort → limit
- field 必须来自 fieldOptions；如不存在，选最接近的并输出 warning 字段
- 时间值支持：上月/本月/本季度/本年/YYYY-MM/YYYY-MM-DD
- 金额、Top N 等数值保留为字符串
模块：{{module}}
可用字段：{{fieldOptions}}
用户需求：{{prompt}}
```

**输出 Schema**：与 §3.3 `RuleItemZ[]` 一致。失败回退：返回 `fallback` 标志，由前端使用预置兜底场景。

### 4.2 规则 → SQL（编译器）

伪代码：

```ts
function compile(module: Module, rules: RuleItem[]): { sql: string; params: any[] } {
  const table = TABLE_MAP[module];           // expense -> public.expense
  const fieldMap = FIELD_MAP[module];        // "部门" -> "dept"
  const where: string[] = [];
  const groupBy: string[] = [];
  const select: string[] = [];
  const orderBy: string[] = [];
  let limit: number | null = null;

  for (const r of rules) {
    const col = fieldMap[r.field];
    switch (r.type) {
      case "time":   where.push(timeRange(col, r.value)); break;
      case "filter": where.push(`${col} ${OP_SQL[r.op!]} $${push(r.value)}`); break;
      case "group":  groupBy.push(col); select.push(col); break;
      case "agg":    select.push(`${AGG_SQL[r.op!]}(${col}) as "${r.op}_${col}"`); break;
      case "sort":   orderBy.push(`${col} ${r.op === "降序" ? "desc" : "asc"}`); break;
      case "limit":  limit = parseInt(r.value, 10); break;
    }
  }
  // 拼接、强校验、防注入
}
```

**安全要求**：

- `field` 必须命中 `fieldMap`（白名单），否则 4001。
- 所有 `value` 走参数化（`$1, $2, ...`）。
- 严禁字符串拼接 user 输入到 SQL。
- 对最终 SQL 进行 `EXPLAIN` 评估行数，>100k 拒绝执行（返回 4001 + 提示"请加更严格筛选"）。

### 4.3 字段映射示例

```ts
export const FIELD_MAP = {
  expense: { "部门":"dept", "金额":"amount", "员工":"user_name", "日期":"occurred_on", "类别":"category" },
  payable: { "供应商":"supplier", "金额":"amount", "账龄":"aging_days", "到期日":"due_date" },
  receivable: { "客户":"customer", "金额":"amount", "账龄":"aging_days" },
  risk: { "等级":"level", "模块":"module", "状态":"status", "发生日期":"occurred_at" },
} as const;
```

### 4.4 CSV 导出

- `text/csv; charset=utf-8`，前缀写入 BOM `\uFEFF`。
- 文件名 `${module}-AI分析-${ts}.csv`，URL-encode。
- 大于 5 万行：异步生成上传到 Storage，返回下载链接。

### 4.5 钉钉推送

```ts
import { hmac } from "https://deno.land/x/hmac/mod.ts";

async function sendDing(webhook: string, secret: string, body: unknown) {
  const ts = Date.now();
  const sign = encodeURIComponent(
    btoa(String.fromCharCode(...new Uint8Array(
      await crypto.subtle.sign("HMAC",
        await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
          { name:"HMAC", hash:"SHA-256" }, false, ["sign"]),
        new TextEncoder().encode(`${ts}\n${secret}`))
    )))
  );
  const url = `${webhook}&timestamp=${ts}&sign=${sign}`;
  const res = await fetch(url, {
    method: "POST", headers: { "content-type":"application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
```

消息体（Markdown）：

```json
{
  "msgtype": "markdown",
  "markdown": {
    "title": "报销 · AI 分析",
    "text": "### 报销 · AI 分析\n> 生成时间: 2026-05-11 10:23\n\n| 部门 | 合计 | 单据 |\n| --- | ---: | ---: |\n| 研发 | 184,500 | 12 |\n"
  },
  "at": { "atMobiles": ["138..."] }
}
```

---

## 5. 金蝶 ERP 集成

### 5.1 鉴权

`POST {KINGDEE_BASE_URL}/Kingdee.BOS.WebApi.ServicesStub.AuthService.LoginByAppSecret.common.kdsvc`

```json
{ "acctID":"{DBID}", "username":"{USER}", "appId":"{APP_ID}", "appSec":"{APP_SECRET}", "lcid":2052 }
```

返回 Cookie，后续接口带 Cookie。

### 5.2 取数接口（示例：报销单）

`POST .../ExecuteBillQuery.common.kdsvc`

```json
{
  "FormId": "ER_Expense",
  "FieldKeys": "FBillNo,FApplierID.FName,FDeptID.FName,FAmount,FDate,FStatus",
  "FilterString": "FDate >= '{from}' AND FDate <= '{to}'",
  "OrderString": "FDate desc",
  "TopRowCount": 0, "StartRow": 0, "Limit": 2000
}
```

### 5.3 字段映射

| 业务字段 | 金蝶字段 |
| --- | --- |
| `id` | `FBillNo` |
| `user_name` | `FApplierID.FName` |
| `dept` | `FDeptID.FName` |
| `amount` | `FAmount` |
| `occurred_on` | `FDate` |
| `status` | `FStatus`（C→approved, A→pending, ...） |

### 5.4 增量同步

- `pg_cron` 每 5 分钟触发 `erp-sync`。
- 以 `erp_sync_state.last_synced_at` 作为 `from`。
- 拉取 → upsert 到 `expense / payable / receivable`。
- 同步失败写 `dingtalk_log` + 告警。

---

## 6. OpenAPI

完整契约见 [`./openapi.yaml`](./openapi.yaml)，可直接喂给 codegen 生成 client / server stub。

---

## 7. 测试矩阵

| 类型 | 工具 | 范围 |
| --- | --- | --- |
| 单元 | Deno test | SQL 编译器、字段映射、签名 |
| 集成 | supatest + 本地 Postgres | RLS、API、ERP mock |
| 契约 | schemathesis on openapi.yaml | 所有 endpoint |
| E2E | Playwright | 关键链路：自然语言 → 结果 → CSV / 钉钉 |

最低门槛：核心模块覆盖率 ≥ 80%，AI SQL 编译器 100%。

---

## 8. 上线检查清单

- [ ] 所有表启用 RLS，且策略经过角色覆盖测试
- [ ] Service Role Key 仅在 Edge Function 内使用
- [ ] 金蝶 / 钉钉 / OpenAI 密钥录入 Secrets，无明文
- [ ] AI 编译器对未知字段、空规则、超大结果集均返回受控错误
- [ ] CSV 导出含 BOM，中文正常
- [ ] 钉钉签名校验通过
- [ ] `audit_log`（如启用）写入审批/付款关键动作
- [ ] 监控：Edge Function 错误率 / ERP 同步延迟 / LLM 失败率
