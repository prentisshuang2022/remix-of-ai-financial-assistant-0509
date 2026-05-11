# 智能财务审核平台 · 文档中心

本目录提供面向研发团队与业务用户的完整文档。

## 文档导航

| 文档 | 受众 | 说明 |
| --- | --- | --- |
| [API 参考](./api-reference.md) | 研发 | 后端接口、请求/响应结构、错误码 |
| [后端实现规范](./backend-spec.md) | 研发 | DB Schema、RLS、Edge Functions、ERP/钉钉集成、AI 编译器 |
| [OpenAPI 契约](./openapi.yaml) | 研发 | 可直接 codegen 的接口契约 |
| [前端组件 API](./frontend-components.md) | 研发 | 复用组件（含 `AIRuleAnalyzer`）的 Props 与扩展方式 |
| [架构总览](./architecture.md) | 研发 | 模块划分、数据流、技术栈 |
| [用户指南](./user-guide.md) | 业务 / 财务 | 各模块功能与操作步骤 |
| [AI 规则配置指南](./ai-rule-analyzer-guide.md) | 业务 / 财务 | 自然语言规则配置、ERP 取数、导出钉钉 |
| [更新日志](./CHANGELOG.md) | 全员 | 版本变更记录 |

## 项目模块

- **报销审核 (Expense)** — 票据 OCR、规则校验、AI 建议
- **应付管理 (Payable)** — 账期、付款计划、风险预警
- **应收管理 (Receivable)** — 客户账龄、回款预测
- **风险监控 (Risk)** — 全局风险事件与处置
- **AI 自定义分析** — 跨模块的自然语言取数与分析
