---
name: code-review
description: Quy trình kiểm tra mã nguồn, rà soát lỗi bảo mật, tối ưu hiệu năng và đảm bảo chuẩn OOP/SOLID.
version: 1.0.0
author: Dan AI Team
tags: [code, review, security, quality, solid]
---

# SOP: Quy Trình Code Review Chuyên Nghiệp

## 1. Mục Tiêu
Đảm bảo mã nguồn đạt chuẩn chất lượng cao, tuân thủ kiến trúc OOP, SOLID, bảo mật và không có lỗ hổng phổ biến (SQL injection, path traversal, memory leak).

## 2. Các Bước Thực Hiện
1. **Kiểm tra Tên & Coding Standard**:
   - Tên biến, hàm, class phải rõ nghĩa, không viết tắt gây mơ hồ (`database` thay vì `db`, `parameters` thay vì `args`).
   - Đảm bảo tuân thủ nguyên tắc Single Responsibility (SRP).
2. **Kiểm tra Bảo Mật (Security Audit)**:
   - Các đầu vào từ người dùng phải được sanitize / validate bằng Zod schema hoặc thư viện tương đương.
   - Thao tác đường dẫn file phải dùng safe path resolver để ngăn chặn Directory Traversal.
   - Lệnh bash hoặc SQL phải được lọc hoặc dùng Prepared Statement.
3. **Kiểm tra Đa Ngôn Ngữ (i18n)**:
   - Không hard-code các thông báo hiển thị cho người dùng trong mã nguồn, phải dùng `@lang`.
4. **Kiểm tra Xử Lý Lỗi & Hiệu Năng**:
   - Các tác vụ bất đồng bộ phải có `try...catch` đầy đủ và giải phóng tài nguyên.
   - Không để lại console.log rác trong môi trường production.
