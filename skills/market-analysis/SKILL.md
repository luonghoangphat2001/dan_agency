---
name: market-analysis
description: Quy trình phân tích thị trường, nghiên cứu đối thủ cạnh tranh và lập báo cáo tổng hợp.
version: 1.0.0
author: Dan AI Team
tags: [market, competitor, analysis, research]
---

# SOP: Quy Trình Phân Tích Thị Trường & Đối Thủ

## 1. Mục Tiêu
Cung cấp bức tranh toàn cảnh về thị trường mục tiêu, xác định điểm mạnh/điểm yếu của đối thủ và đề xuất cơ hội kinh doanh.

## 2. Các Bước Thực Hiện
1. **Thu Thập Thông Tin Sơ Cấp & Thứ Cấp**:
   - Sử dụng tool `web_search` để tìm kiếm thông tin về quy mô thị trường, xu hướng tăng trưởng và báo cáo ngành.
   - Sử dụng tool `web_crawl` để cào dữ liệu trang chủ, bảng giá và tính năng chính của top 3 đối thủ trực tiếp.
2. **Phân Tích Mô Hình SWOT**:
   - Strengths (Điểm mạnh)
   - Weaknesses (Điểm yếu)
   - Opportunities (Cơ hội)
   - Threats (Thách thức)
3. **Lưu Trữ Báo Cáo Vào Workspace**:
   - Sử dụng tool `workspace_file` với action `write` để lưu báo cáo dạng Markdown vào thư mục `reports/market-analysis-[date].md`.
4. **Tổng Hợp Trả Lời Người Dùng**:
   - Trả lời tóm tắt cho người dùng các phát hiện chính và dẫn link/vị trí file báo cáo trong workspace.
