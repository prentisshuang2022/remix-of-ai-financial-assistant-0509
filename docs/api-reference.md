# API 参考（研发）

> 当前前端使用 mock 数据演示业务流程；以下接口为后端落地建议契约，供研发对接 ERP / Lovable Cloud Edge Function 实现。
> 所有接口默认返回 JSON，鉴权使用 `Authorization: Bearer <token>`。

## 通用约定

### 响应包络

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

### 错误码

| code | HTTP | 含义 |
| ---: | ---: | --- |
| 0 | 200 | 成功 |
| 4001 | 400 | 参数缺失或格式错误 |
| 4010 | 401 | 未登录 / Token 失效 |
| 4030 | 403 | 无权限 |
| 4040 | 404 | 资源不存在 |
| 4290 | 429 | 频率受限 |
| 5000 | 500 | 服务内部错误 |
| 6001 | 502 | ERP 上游错误 |
| 6002 | 502 | 钉钉推送失败 |

### 分页参数

`page`（从 1 起）, `pageSize`（默认 20，最大 200），返回中携带 `total`。

---

## 1. 报销审核 Expense

### 1.1 列表

`GET /api/expense/list`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| dateFrom | string(YYYY-MM-DD) | 否 | 起始日期 |
| dateTo | string | 否 | 截止日期 |
| dept | string | 否 | 部门 |
| risk | `高` \| `中` \| `低` | 否 | 风险等级 |
| status | string | 否 | 单据状态 |
| page,pageSize | number | 否 | 分页 |

返回 `data.items[]`：

```json
{
  "id": "BX-2025-04-1083",
  "user": "王浩",
  "dept": "市场部",
  "amount": 4820.00,
  "cnt": 6,
  "rule": { "ok": false, "hit": 2 },
  "dup":  { "ok": false, "n": 1 },
  "risk": "高",
  "suggest": "退回",
  "suggestNote": "餐费发票号尾号集中",
  "status": "待人工确认"
}
```

### 1.2 详情

`GET /api/expense/:id` → 返回单据完整字段（含票据、明细、规则命中、OCR）。

### 1.3 审批动作

`POST /api/expense/:id/action`

```json
{ "action": "approve" | "reject" | "manual", "comment": "..." }
```

---

## 2. 应付 Payable

`GET /api/payable/list` 参数：`supplier`、`agingBucket`（`0-30`/`31-60`/`61-90`/`90+`）、`status`、分页。

`POST /api/payable/plan` 创建付款计划：

```json
{ "items": ["AP-001", "AP-002"], "payDate": "2025-05-20", "channel": "网银" }
```

---

## 3. 应收 Receivable

`GET /api/receivable/list` 参数：`customer`、`agingBucket`、分页。

`GET /api/receivable/forecast?period=monthly` 返回回款预测序列。

---

## 4. 风险 Risk

`GET /api/risk/events` 参数：`level`（`high|mid|low`）、`module`、`status`、分页。

`POST /api/risk/events/:id/handle`

```json
{ "action": "ack" | "close" | "escalate", "comment": "..." }
```

---

## 5. AI 自定义分析

驱动 `AIRuleAnalyzer` 组件，跨模块共用。

### 5.1 自然语言 → 规则

`POST /api/ai/parse-rules`

请求：

```json
{
  "module": "expense",
  "prompt": "上月研发部超过5000元的报销，按部门汇总并取Top10",
  "fieldOptions": ["部门", "金额", "员工", "日期", "类别"]
}
```

返回：

```json
{
  "rules": [
    { "id": "r1", "type": "时间", "field": "日期",  "op": "=",  "value": "上月" },
    { "id": "r2", "type": "筛选", "field": "部门",  "op": "=",  "value": "研发部" },
    { "id": "r3", "type": "筛选", "field": "金额",  "op": ">",  "value": "5000" },
    { "id": "r4", "type": "分组", "field": "部门",  "op": "按",  "value": "" },
    { "id": "r5", "type": "聚合", "field": "金额",  "op": "合计","value": "" },
    { "id": "r6", "type": "限制", "field": "—",    "op": "Top","value": "10" }
  ],
  "source": "金蝶 ERP · 报销主表"
}
```

### 5.2 规则取数

`POST /api/ai/run`

请求：

```json
{
  "module": "expense",
  "rules": [ /* RuleItem[] */ ],
  "format": "table"
}
```

返回：

```json
{
  "columns": ["部门", "合计金额", "单据数"],
  "rows": [["研发中心", 184500, 12], ["市场部", 92340, 9]],
  "source": "金蝶 ERP",
  "generatedAt": "2026-05-11T10:23:00+08:00"
}
```

### 5.3 导出 CSV

`POST /api/ai/export` 请求体同 5.2，响应 `Content-Type: text/csv; charset=utf-8`，附 BOM。

### 5.4 推送钉钉

`POST /api/ai/notify/dingtalk`

```json
{
  "module": "expense",
  "title": "报销 · AI 分析",
  "result": { "columns": [...], "rows": [...] },
  "groupId": "finance_main",
  "atMobiles": ["138...."]
}
```

返回 `data.messageId`。

---

## 6. 鉴权 / 用户

> 上线时由 Lovable Cloud Auth 提供。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | 账号登录 |
| POST | `/api/auth/logout` | 登出 |
| GET  | `/api/auth/me` | 当前用户与角色 |

角色枚举：`admin` / `finance` / `auditor` / `viewer`。RLS 策略详见 `docs/architecture.md`。

---

## 7. RuleItem 数据字典

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 客户端生成的唯一 id |
| type | `时间` \| `筛选` \| `分组` \| `聚合` \| `排序` \| `限制` | 规则类型 |
| field | string | 字段名（来自模块的 `fieldOptions`） |
| op | string | 操作符，详见下表 |
| value | string | 取值（数值/日期/枚举/Top N） |

操作符：

| type | 可选 op |
| --- | --- |
| 时间 | `=` |
| 筛选 | `>` `≥` `<` `≤` `=` `≠` `包含` `不包含` `属于` |
| 分组 | `按` |
| 聚合 | `合计` `平均` `最大` `最小` `计数` |
| 排序 | `降序` `升序` |
| 限制 | `Top` |
