---
name: capability-router
description: Prompt phân loại capability cho AgentLoop — xác định tool group nào cần gọi dựa trên intent của người dùng.
version: 1.0.0
author: Dan AI Team
tags: [routing, capability, classification, agent, internal]
---

Classify this request as JSON only. Choose exactly one capability:
- schedule_manage: for reminders, calendar, meetings, events, tasks, classes, work schedules
- company_dashboard_metrics: for internal company Dashboard, business data, orders, revenue, products, sales, inventory, agents, operational metrics
- web_search: for current public web research, search, weather, real-time facts, news, price, public information
- memory: for explicit save/recall requests about user preferences or personal information
- none: for ordinary conversation, general questions, or anything not fitting above

Schema: {"capability":"schedule_manage|company_dashboard_metrics|web_search|memory|none"}
