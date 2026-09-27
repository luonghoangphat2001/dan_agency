---
name: system-health-check
description: Quy trình kiểm tra sức khỏe hệ thống, rà soát log lỗi, kiểm tra kết nối database và tài nguyên server.
version: 1.0.0
author: OpenClaw Core
tags: [devops, monitoring, health, gateway]
---

# SOP: Quy Trình Kiểm Tra Sức Khỏe Gateway & Hệ Thống

## 1. Mục Tiêu
Đánh giá độ ổn định, phát hiện tắc nghẽn hoặc lỗi tiềm ẩn trong Gateway, Database pool và các dịch vụ nền.

## 2. Các Bước Thực Hiện
1. **Kiểm Tra Trạng Thái Dịch Vụ**:
   - Chạy lệnh `openclaw status` hoặc gọi endpoint `/health` để xác minh trạng thái HTTP 200.
2. **Kiểm Tra MySQL Database Pool**:
   - Kiểm tra kết nối cơ sở dữ liệu, số lượng active connections và thời gian phản hồi truy vấn.
3. **Rà Soát Log Lỗi Gần Nhất**:
   - Sử dụng tool `workspace_file` hoặc lệnh bash an toàn để kiểm tra các file log trong thư mục `logs/`.
4. **Kiểm Tra Tài Nguyên Bộ Nhớ & CPU**:
   - Đo lường dung lượng RAM heap used so với heap total.
