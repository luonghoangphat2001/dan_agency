---
name: schedule-intent
description: Parse Vietnamese natural-language schedule commands and reminders into structured JSON payloads.
version: 1.0.0
tags: [schedule, reminder, datetime, nlp, openclaw]
---

# Schedule Intent Parsing

## Parse Schedule Prompt
Hôm nay là {{nowStr}}. Parse lịch từ text sau (tiếng Việt).
Text: "{{text}}"
Trả về JSON: { "title": "...", "remind_at": "YYYY-MM-DD HH:MM:SS" (giờ {{tz}}), "repeat_type": "none|daily|weekly" }
Chỉ trả JSON, không giải thích. Nếu không parse được, trả { "error": "..." }

## Parse Update Prompt
Hôm nay là {{nowStr}}. Parse yêu cầu chỉnh sửa lịch từ text sau (tiếng Việt).
Text: "{{text}}"
Trả về JSON object (chỉ JSON, không giải thích):
{"id":<số ID hoặc null>,"search_keyword":"<từ khoá tìm lịch hoặc null>","title":"<tiêu đề mới hoặc null>","remind_at":"<YYYY-MM-DD HH:MM:SS mới hoặc null>","repeat_type":"<none|daily|weekly hoặc null>"}
