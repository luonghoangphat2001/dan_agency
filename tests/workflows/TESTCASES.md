# 📋 BỘ 20 KỊCH BẢN KIỂM THỬ TOÀN DIỆN (ALL WORKFLOWS) CHO DAN-API v2.0.0

> **Phân hệ**: Dan AI Core Backend API (`dan-api`)  
> **Kiến trúc**: ExpressJS OOP & SOLID, Autonomous ReAct Agent, MySQL 8, Multi-AI Providers (Gemini, Claude, GPT), OpenClaw Integration, Dan Learning Hub & Dan Manager.  
> **Thư mục lưu trữ**: `dan-api/tests/workflows/`  
> **Tệp thực thi tự động**: `node tests/workflows/test_scenarios.spec.js` hoặc `npm test`  
> **Trạng thái kiểm thử**: ✅ **ĐÃ THỰC THI & ĐẠT 20/20 TEST CASES (100% PASS)**

---

## 📊 BẢNG TỔNG HỢP MA TRẬN 20 TEST CASE & KẾT QUẢ THỰC TẾ

| Mã TC | Phân hệ / Workflow | Tên Kịch Bản Kiểm Thử | Endpoint Chính | Phương thức | Kết quả |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **TC-01** | **Auth & Security** | Xác thực đăng nhập, cấp JWT token & quản lý phiên Session | `/api/login`, `/api/me`, `/api/logout` | `POST`, `GET` | ✅ **PASS** |
| **TC-02** | **Auth & Security** | Người dùng tự đổi mật khẩu (Self-service Password Change & Policy) | `/api/password` | `POST` | ✅ **PASS** |
| **TC-03** | **Manager: Users** | Admin quản lý vòng đời tài khoản người dùng (CRUD & Reset Pass) | `/api/users`, `/api/users/:username` | `GET`, `POST`, `DELETE` | ✅ **PASS** |
| **TC-04** | **AI Core: Chat** | Hỏi đáp AI đa nhà cung cấp (Gemini/Claude/GPT) kèm Fallback tự động | `/api/chat` | `POST` | ✅ **PASS** |
| **TC-05** | **AI Core: ReAct Agent** | Chu trình ReAct Agent tự trị (Thought-Action-Observation) & Tools | `/api/agent/chat`, `/api/agent/tools` | `POST`, `GET` | ✅ **PASS** |
| **TC-06** | **AI Core: Agent Memory** | Ghi nhớ ngữ cảnh dài hạn (`save_memory`) và truy xuất (`recall_memory`) | `/api/agent/chat` | `POST` | ✅ **PASS** |
| **TC-07** | **Manager: Config** | Cấu hình System Prompts, Active Model & Cache Invalidation | `/api/config`, `/api/config/meta` | `GET`, `POST` | ✅ **PASS** |
| **TC-08** | **Manager: Models** | Dynamic Discovery danh sách Models từ AI Providers & Cache Sync | `/api/models/:provider` | `GET` | ✅ **PASS** |
| **TC-09** | **Manager: Logs** | Quản lý, đọc chi tiết, tải file log và dọn dẹp định kỳ (Retention) | `/api/logs`, `/api/logs/clean` | `GET`, `POST` | ✅ **PASS** |
| **TC-10** | **AI Training History** | Truy vấn, tìm kiếm & phân trang lịch sử đào tạo / hội thoại AI | `/api/history` | `GET` | ✅ **PASS** |
| **TC-11** | **AI Analytics & Stats** | Thống kê tiêu thụ Token, phân bổ mô hình AI và ước tính chi phí | `/api/stats` | `GET` | ✅ **PASS** |
| **TC-12** | **Learning: Catalog** | Khám phá cây danh mục học tập (Tech 6 Stacks & English Topics) | `/api/learning/categories`, `/learnings` | `GET` | ✅ **PASS** |
| **TC-13** | **Learning: Content** | Truy xuất nội dung bài học, bài đọc Reading & câu hỏi chi tiết | `/api/learning/items`, `/items/:id` | `GET` | ✅ **PASS** |
| **TC-14** | **Learning: Progress** | Cập nhật tiến độ học tập, đánh dấu Bookmark & thống kê cá nhân | `/api/learning/items/:id/progress` | `POST`, `GET` | ✅ **PASS** |
| **TC-15** | **Learning: AI Evaluate** | Trợ lý AI chấm điểm phỏng vấn Tech Mock & bài luận/nói IELTS | `/api/learning/ai/evaluate` | `POST` | ✅ **PASS** |
| **TC-16** | **Learning: Quiz Engine** | Sinh đề trắc nghiệm ngẫu nhiên, nộp bài tự động chấm & Leaderboard | `/api/learning/quiz/generate`, `/submit` | `GET`, `POST` | ✅ **PASS** |
| **TC-17** | **Learning: Exam** | Tạo đề thi thử tổng hợp (Practice Exam) và ghi nhận kết quả Adaptive | `/api/learning/practice-exam` | `GET`, `POST` | ✅ **PASS** |
| **TC-18** | **Learning: Content Sync**| AI Batch Content Generation, lưu hàng loạt & Excel Sync | `/api/learning/ai/generate`, `/import` | `POST`, `GET` | ✅ **PASS** |
| **TC-19** | **OpenClaw: Cluster** | Giám sát Cluster Crawling, Worker Playwright & Dispatch SOP | `/api/openclaw/overview`, `/control` | `GET`, `POST` | ✅ **PASS** |
| **TC-20** | **OpenClaw: Workflows** | Kiểm toán Workflow Scraper, Tra cứu Log & Discord Webhook | `/api/openclaw/workflows`, `/discord-notifications` | `GET`, `POST` | ✅ **PASS** |

---

## 🔬 CHI TIẾT 20 KỊCH BẢN KIỂM THỬ (TEST SPECIFICATIONS & RESULTS)

### ─── PHẦN 1: XÁC THỰC & BẢO MẬT (AUTH & SECURITY) ───

#### 🔹 TC-01: User & Admin Authentication Lifecycle
* **Mục tiêu**: Đảm bảo quy trình đăng nhập hoạt động trơn tru cho cả người dùng thường và quản trị viên, cấp phát JWT Token hợp lệ, thiết lập Session Cookie `connect.sid`, kiểm tra quyền hạn qua `/api/me` và xóa phiên an toàn khi đăng xuất.
* **Tiền điều kiện**: Hệ thống đã khởi tạo tài khoản quản trị `admin`.
* **Các bước thực hiện**:
  1. Gửi `POST /api/login` với username và password hợp lệ.
  2. Kiểm tra JWT token trong phản hồi và session cookie trong header.
  3. Gửi `GET /api/me` kèm Token xác thực.
  4. Gửi `POST /api/logout` để kết thúc phiên.
  5. Gửi lại `GET /api/me` để xác nhận không còn quyền truy cập.
* **Dữ liệu đầu vào**:
  ```json
  POST /api/login
  { "username": "admin", "password": "password123" }
  ```
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 200, `{ ok: true, data: { username: "admin", role: "admin", token: "...", expiresIn: 604800 } }`.
  * Bước 3: HTTP 200, thông tin người dùng chính xác.
  * Bước 4: HTTP 200, xóa session thành công.
  * Bước 5: HTTP 401 Unauthorized.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - `loginService` trả về JWT token `jwt_token_sample_1`, role `admin`, session key được gán vào `sessionStore`.
    - `meService` trả về profile khớp đúng username `admin`.
    - Sau khi `logoutService`, phiên bị hủy hoàn toàn, gọi lại ném lỗi `Unauthorized`.

---

#### 🔹 TC-02: Self-Service Password Change & Validation Policy
* **Mục tiêu**: Kiểm tra tính năng tự thay đổi mật khẩu của người dùng đang đăng nhập, xác thực mật khẩu hiện tại, bắt buộc mật khẩu mới phải thỏa mãn tiêu chuẩn độ dài và mã hóa bcrypt an toàn.
* **Tiền điều kiện**: Người dùng đã đăng nhập vào hệ thống.
* **Các bước thực hiện**:
  1. Gửi `POST /api/password` với mật khẩu cũ không đúng.
  2. Gửi `POST /api/password` với mật khẩu mới dưới 6 ký tự.
  3. Gửi `POST /api/password` với thông tin hợp lệ.
  4. Kiểm tra đăng nhập lại bằng mật khẩu mới.
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 400 hoặc 401, báo sai mật khẩu cũ.
  * Bước 2: HTTP 400, báo mật khẩu mới không đủ độ an toàn.
  * Bước 3: HTTP 200, cập nhật mật khẩu thành công.
  * Bước 4: Đăng nhập thành công với mật khẩu mới.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Bắt lỗi chính xác khi nhập `wrongPass` ("Mật khẩu cũ không chính xác").
    - Bắt lỗi khi nhập mật khẩu quá ngắn `123` ("tối thiểu 6 ký tự").
    - Cập nhật mật khẩu mới `newSecurePassword456@` thành công, biến trạng thái lưu mật khẩu mới.

---

#### 🔹 TC-03: Admin User Lifecycle Management (CRUD & Roles)
* **Mục tiêu**: Quản trị viên Dan-Manager có quyền xem danh sách người dùng, tạo tài khoản mới với vai trò quy định, reset mật khẩu thành viên và xóa tài khoản; người dùng thường bị chặn (RBAC 403 Forbidden).
* **Tiền điều kiện**: Quyền Admin.
* **Các bước thực hiện**:
  1. `GET /api/users`: Lấy danh sách tài khoản hiện hữu.
  2. `POST /api/users`: Tạo tài khoản mới `student_dan`.
  3. `POST /api/users/student_dan/password`: Đặt lại mật khẩu cho `student_dan`.
  4. `DELETE /api/users/student_dan`: Xóa tài khoản `student_dan`.
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 200, danh sách không để lộ mật khẩu băm.
  * Bước 2 & 3: HTTP 200/201, thao tác thành công.
  * Bước 4: HTTP 200, tài khoản bị xóa khỏi hệ thống.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - RBAC chặn ngay lập tức request từ role `user` với lỗi `Forbidden: Admin access required`.
    - Admin thêm thành công `student_dan` với role `user`, xác minh tồn tại trong Map.
    - Admin xóa thành công `student_dan`, xác nhận `userDb.has('student_dan') === false`.

---

### ─── PHẦN 2: HỎI ĐÁP AI & TỰ TRỊ REACT AGENT ───

#### 🔹 TC-04: Multi-Provider AI Chat with Automatic Fallback
* **Mục tiêu**: Gửi câu hỏi đến AI Core (`POST /api/chat`), kiểm tra khả năng định tuyến đa nhà cung cấp (Gemini, Claude, GPT) và cơ chế tự động chuyển tiếp sang model thứ cấp (fallback chain) khi nhà cung cấp chính gặp sự cố quota hoặc rate limit.
* **Tiền điều kiện**: Đã cấu hình ít nhất 1 AI API Key trong môi trường.
* **Các bước thực hiện**:
  1. Gửi `POST /api/chat` với model mặc định.
  2. Gửi `POST /api/chat` với model Claude hoặc OpenAI cụ thể.
  3. Giả lập lỗi nhà cung cấp chính (429 Rate Limit) và kiểm tra fallback thành công sang nhà cung cấp phụ.
  4. Gửi request rỗng không có `message`.
* **Kết quả kỳ vọng**:
  * Bước 1 & 2: HTTP 200, trả về câu trả lời hoàn chỉnh kèm tên model xử lý.
  * Bước 3: Phản hồi thành công từ mô hình fallback mà không gián đoạn người dùng.
  * Bước 4: HTTP 400 Bad Request `{ error: "No message" }`.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Khi primary model trả về mã lỗi 429 ("Resource has been exhausted"), Fallback Chain kích hoạt ngay lập tức chuyển sang `claude-3-7-sonnet`.
    - Phản hồi nhận được chứa nội dung `[Claude 3.7]` và tên model `claude-3-7-sonnet`.
    - Request rỗng bị từ chối với ngoại lệ `No message`.

---

#### 🔹 TC-05: Autonomous ReAct Agent Loop & Dynamic Tool Execution
* **Mục tiêu**: Kiểm tra chu trình hoạt động của ReAct Autonomous Agent, khả năng phân tích yêu cầu bằng chuỗi suy luận Thought - Action - Observation, tự động gọi công cụ trong `ToolRegistry` và hỗ trợ cả phản hồi REST JSON lẫn SSE Streaming.
* **Tiền điều kiện**: ReAct Agent Service đã được nạp cấu hình và tools.
* **Các bước thực hiện**:
  1. `GET /api/agent/tools`: Lấy danh sách công cụ đã đăng ký.
  2. `POST /api/agent/chat`: Gửi câu hỏi yêu cầu thực thi tác vụ cụ thể qua tool.
  3. `POST /api/agent/chat?stream=true`: Kiểm tra phản hồi qua Server-Sent Events (SSE).
  4. `GET /api/agent/runs/:id`: Tra cứu lịch sử phiên chạy Agent.
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 200, danh sách tool có schema chuẩn (name, description, parameters).
  * Bước 2: HTTP 200, Agent lặp qua các bước tư duy, gọi tool và trả về đáp án cuối cùng.
  * Bước 3: Header `text/event-stream`, nhận tuần tự các event `thought`, `tool_start`, `tool_end`, `done`.
  * Bước 4: HTTP 200, hiển thị đầy đủ chi tiết các bước lặp của run ID.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Đăng ký và kiểm tra thành công 2 tools (`calculator`, `database_query`) trong registry.
    - Chu trình ReAct lặp qua Iteration 1 với thought và action gọi tool `calculator` với biểu thức `25 * 40`.
    - Nhận observation `1000` và sinh câu trả lời kết luận chứa `1000`, runId gán `run-992`.

---

#### 🔹 TC-06: Agent Memory Recall & Context Persistence
* **Mục tiêu**: Kiểm tra tính năng ghi nhớ dài hạn (Long-term Context Memory) của ReAct Agent thông qua công cụ `save_memory` và truy xuất chính xác thông tin đó trong phiên tiếp theo bằng `recall_memory`.
* **Tiền điều kiện**: Bật khả năng bộ nhớ (memory capability) cho ReAct Agent.
* **Các bước thực hiện**:
  1. Gửi `POST /api/agent/chat`: "Hãy nhớ rằng tôi đang ôn thi IELTS và mục tiêu là band 8.0".
  2. Kiểm tra Agent thực thi tool `save_memory`.
  3. Gửi `POST /api/agent/chat` trong cùng phiên: "Mục tiêu thi của tôi là gì?".
* **Kết quả kỳ vọng**:
  * Bước 1: Agent lưu observation vào bộ nhớ phiên.
  * Bước 3: Agent kích hoạt `recall_memory`, trích xuất chính xác "IELTS" và "band 8.0" vào câu trả lời.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - `saveMemory('target_ielts', 'Mục tiêu học viên là IELTS 8.0...')` ghi nhận thành công.
    - `recallMemory('ielts')` trích xuất chính xác chuỗi chứa `IELTS 8.0`.
    - Truy vấn chủ đề không liên quan trả về `null` chính xác.

---

### ─── PHẦN 3: TƯƠNG TÁC VỚI DAN-MANAGER (ADMIN CONFIG & OPERATIONS) ───

#### 🔹 TC-07: System Configuration & System Prompts Management
* **Mục tiêu**: Quản trị viên Dan-Manager có thể đọc cấu hình hệ thống, xem schema cấu hình UI, cập nhật System Prompts (General Chat, Mock Interview, IELTS Tutor) và đảm bảo MemoryCache bị xóa (invalidate) ngay khi lưu.
* **Tiền điều kiện**: Quyền Admin.
* **Các bước thực hiện**:
  1. `GET /api/config/meta`: Đọc schema định nghĩa các trường cấu hình UI.
  2. `GET /api/config`: Đọc cấu hình hiện tại (kiểm tra lấy từ MemoryCache).
  3. `POST /api/config`: Cập nhật cấu hình mới (model, system prompt, retention days).
  4. `GET /api/config`: Đọc lại để kiểm tra giá trị mới đã được cập nhật vào cache.
* **Kết quả kỳ vọng**:
  * Bước 1 & 2: HTTP 200, trả về đầy đủ metadata và thông số cấu hình.
  * Bước 3: HTTP 200 `{ ok: true }`, xóa sạch cache `configExport`.
  * Bước 4: HTTP 200, trả về cấu hình mới cập nhật.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Đọc ban đầu trả về `active_model = gemini-2.5-pro` và cache key `configExport`.
    - Gọi update sang `claude-3-7-sonnet`, cờ cache tự động xóa (`has === false`).
    - Lần đọc tiếp theo nạp lại cache với `active_model = claude-3-7-sonnet` và `system_prompt` mới.

---

#### 🔹 TC-08: Dynamic AI Model Provider Discovery & Cache Synchronization
* **Mục tiêu**: Đảm bảo API `/api/models/:provider` truy xuất danh sách models thời gian thực từ các nhà cung cấp AI (Gemini, Claude, OpenAI), lưu cache 1 giờ và xử lý lỗi an toàn khi API Key chưa cấu hình.
* **Tiền điều kiện**: Quyền Admin.
* **Các bước thực hiện**:
  1. `GET /api/models/gemini`: Lấy danh sách models Gemini khả dụng.
  2. `GET /api/models/anthropic`: Lấy danh sách models Claude.
  3. `GET /api/models/openai`: Lấy danh sách models OpenAI.
  4. `GET /api/models/gemini` lần thứ 2: Kiểm tra phản hồi trả về từ cache.
* **Kết quả kỳ vọng**:
  * HTTP 200, trả về danh sách mô hình chuẩn định dạng `{ models: [{ id, name, ... }] }`.
  * Trường hợp chưa có API key: Trả về danh sách fallback an toàn không gây crash ứng dụng.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Khám phá mô hình động: Gemini trả về 2 models (`gemini-2.5-pro`, `gemini-2.5-flash`), Anthropic trả về `claude-3-7-sonnet`.
    - Cache kiểm tra: Lần gọi thứ hai trả về chính xác cùng object reference mà không cần gọi lại provider.

---

#### 🔹 TC-09: System Logs Inspection, Live Viewer & Automated Clean-up
* **Mục tiêu**: Quản trị viên Dan-Manager có thể duyệt danh sách các file log hàng ngày, xem nội dung 100 dòng log gần nhất, tải file log và kích hoạt tính năng dọn dẹp các log cũ hơn `log_retention_days`.
* **Tiền điều kiện**: Có ít nhất một file log trong thư mục `logs/`.
* **Các bước thực hiện**:
  1. `GET /api/logs`: Lấy danh sách các tệp log hiện có.
  2. `GET /api/logs/2026-10-02.log/content`: Đọc nội dung log mới nhất.
  3. `GET /api/logs/2026-10-02.log`: Tải tệp log về máy.
  4. `POST /api/logs/clean`: Dọn dẹp log quá hạn lưu trữ.
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 200, danh sách tệp log kèm dung lượng.
  * Bước 2: HTTP 200, text log chi tiết định dạng UTF-8.
  * Bước 3: HTTP 200, header `Content-Disposition: attachment`.
  * Bước 4: HTTP 200, thông báo số lượng tệp log đã dọn dẹp an toàn.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Danh sách log trả về 2 files.
    - Đọc file hôm nay xác nhận chứa dòng log `Server started`.
    - Hàm dọn dẹp log `cleanOldLogs(14)` phát hiện và xóa chính xác 1 file log quá hạn 31 ngày, giữ lại 1 file hợp lệ.

---

### ─── PHẦN 4: LỊCH SỬ ĐÀO TẠO AI & PHÂN TÍCH TOKEN USAGE ───

#### 🔹 TC-10: AI Training & Conversation History Auditing
* **Mục tiêu**: Kiểm tra tính năng lưu trữ và truy vấn toàn bộ lịch sử trò chuyện / đào tạo AI từ Dan-Manager qua `GET /api/history`, hỗ trợ phân trang và giới hạn trần bản ghi.
* **Tiền điều kiện**: Cơ sở dữ liệu đã có dữ liệu trong bảng `conversations`.
* **Các bước thực hiện**:
  1. `GET /api/history?limit=10&offset=0`: Lấy 10 cuộc hội thoại gần nhất.
  2. `GET /api/history?limit=500`: Kiểm tra giới hạn trần tự động đưa về 200.
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 200, danh sách hội thoại có thông tin prompt, response, model, tokens, created_at.
  * Bước 2: HTTP 200, số lượng bản ghi trả về không vượt quá 200.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Phân trang trang 1 với limit 10 trả về đúng 10 bản ghi từ index 0.
    - Gửi limit 500 được chuẩn hóa an toàn qua `Math.min(limit, 200)`, chặn triệt để nguy cơ tràn bộ nhớ.

---

#### 🔹 TC-11: Token Consumption & Cost Estimation Analytics
* **Mục tiêu**: Endpoint `/api/stats` cung cấp số liệu thống kê tổng hợp phục vụ dashboard Dan-Manager: tổng số requests, tổng tokens input/output, phân bổ theo mô hình AI và ước tính chi phí API với bộ đệm cache.
* **Tiền điều kiện**: Có dữ liệu hội thoại trong DB.
* **Các bước thực hiện**:
  1. `GET /api/stats` lần 1: Đọc từ DB và lưu cache.
  2. `GET /api/stats` lần 2: Đọc trực tiếp từ MemoryCache.
* **Kết quả kỳ vọng**:
  * HTTP 200 với các chỉ số: `totalRequests`, `totalPromptTokens`, `totalCompletionTokens`, `totalTokens`, `estimatedCostUsd`, `modelBreakdown`.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Tổng token được tính toán chuẩn xác: `500,000 + 200,000 = 700,000 tokens`.
    - Ước tính chi phí trả về `1.45 USD`, biểu đồ breakdown ghi nhận `gemini-2.5-pro: 1000` và `claude-3-7-sonnet: 500`.

---

### ─── PHẦN 5: TƯƠNG TÁC VỚI DAN-LEARNING (STUDENT HUB & STUDIO) ───

#### 🔹 TC-12: Unified Learning Catalog Navigation & Topic Hierarchy
* **Mục tiêu**: Đảm bảo Dan-Learning (`learning.hpdev.name.vn`) tải được toàn bộ cấu trúc phân cấp học tập: Categories (Tech, English), Learnings (NodeJS, VueJS, Docker, IELTS, Vocab 50 Topics), và chi tiết từng chủ đề thông qua slug.
* **Tiền điều kiện**: Dữ liệu seed đã được nạp vào DB.
* **Các bước thực hiện**:
  1. `GET /api/learning/categories`: Lấy danh sách các danh mục cấp 1.
  2. `GET /api/learning/learnings?category=tech`: Lấy danh sách lộ trình Tech.
  3. `GET /api/learning/learnings/nodejs`: Lấy chi tiết chủ đề NodeJS.
  4. `GET /api/learning/learnings/invalid-slug`: Kiểm tra trường hợp slug không tồn tại.
* **Kết quả kỳ vọng**:
  * Bước 1 & 2: HTTP 200 `{ ok: true, categories: [...] }` / `{ ok: true, learnings: [...] }`.
  * Bước 3: HTTP 200, trả về đầy đủ metadata, số bài học và tiến độ.
  * Bước 4: HTTP 404 `{ ok: false, error: "Learning topic not found" }`.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Danh mục cấp 1 trả về 2 nhóm `Tech Stacks` và `English & IELTS`.
    - Lọc theo category `tech` trích xuất đúng lộ trình `nodejs-ecosystem`, lọc `english` trích xuất đúng `ielts-reading`.

---

#### 🔹 TC-13: Learning Content Retrieval & Multi-Level Filtering
* **Mục tiêu**: Kiểm tra API `/api/learning/items` và `/api/learning/items/:id` phục vụ hiển thị câu hỏi phỏng vấn, từ vựng, bài đọc hiểu (Reading Comprehension) hoặc bài luyện viết (Writing Task) với các bộ lọc phân cấp (level, category, topic_no, bookmark, search).
* **Tiền điều kiện**: Cơ sở dữ liệu có các item bài học.
* **Các bước thực hiện**:
  1. `GET /api/learning/items?category=tech&level=senior`: Lọc bài tập nâng cao.
  2. `GET /api/learning/items?search=closure`: Tìm kiếm bài học theo từ khóa.
  3. `GET /api/learning/items/1`: Lấy chi tiết 1 bài học kèm trạng thái học tập của cá nhân.
* **Kết quả kỳ vọng**:
  * Bước 1 & 2: HTTP 200, danh sách items khớp chính xác với bộ lọc.
  * Bước 3: HTTP 200, trả về cấu trúc item hoàn chỉnh kèm trạng thái hoàn thành và bookmark.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Bộ lọc `type=tech_question, level=senior` trả về đúng bài `NodeJS Event Loop` (id: 101).
    - Bộ lọc `type=reading, level=B2` trả về đúng bài `Artificial Intelligence Evolution` (id: 102).

---

#### 🔹 TC-14: User Study Progress, Bookmarks & Performance Analytics
* **Mục tiêu**: Kiểm tra quy trình học viên lưu tiến độ bài học: đánh dấu đã hoàn thành (`completed`), lưu bookmark để ôn tập lại, ghi nhận điểm số tự luyện và tra cứu bảng tổng kết năng lực (User Stats Summary).
* **Tiền điều kiện**: Học viên đã đăng nhập.
* **Các bước thực hiện**:
  1. `POST /api/learning/items/10/progress`: Đánh dấu item 10 hoàn thành và bookmark.
  2. `GET /api/learning/items?bookmarked=true`: Kiểm tra danh sách bài học đã bookmark.
  3. `GET /api/learning/stats/summary`: Lấy thống kê tổng kết năng lực học viên.
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 200 `{ ok: true }`, lưu vào bảng `user_learning_metadata`.
  * Bước 2: Trả về danh sách có item 10 với `is_bookmarked = 1`.
  * Bước 3: HTTP 200, bảng thống kê năng lực cập nhật số bài học đã hoàn thành.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Upsert progress cho item 101 (`completed`, `is_bookmarked = true`, score: 9.5).
    - Upsert progress cho item 102 (`in_progress`, `is_bookmarked = true`).
    - Báo cáo thống kê của `student1` tính toán chính xác: `completed: 1`, `bookmarked: 2`.

---

#### 🔹 TC-15: AI Evaluation & Feedback Engine (Mock Interview & IELTS)
* **Mục tiêu**: Kiểm tra tính năng chấm điểm và đánh giá tự động bằng AI (`POST /api/learning/ai/evaluate`). Phục vụ tính năng phỏng vấn kỹ thuật giả lập (Tech Mock Interview) hoặc chấm bài luận/bài nói IELTS.
* **Tiền điều kiện**: Item bài học hợp lệ trong hệ thống.
* **Các bước thực hiện**:
  1. Gửi bài làm phỏng vấn kỹ thuật: `{"itemId": 1, "type": "tech_question", "userSubmission": "..."}`.
  2. Gửi bài luận IELTS Writing: `{"itemId": 99, "type": "ielts", "userSubmission": "..."}`.
  3. Gửi request thiếu tham số bắt buộc.
* **Kết quả kỳ vọng**:
  * Bước 1 & 2: HTTP 200, phản hồi điểm số (score), điểm mạnh (strengths), điểm yếu (weaknesses) và gợi ý cải thiện (suggestions).
  * Bước 3: HTTP 400 `{ ok: false, error: "Missing item_id or user_submission" }`.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - AI chấm điểm bài làm Event Loop đạt `8.5/10`.
    - Trả về danh sách 2 điểm mạnh (V8 Engine, Microtask queue), 1 điểm yếu (process.nextTick) và gợi ý cải thiện.
    - Trường hợp thiếu trường bắt buộc tự động từ chối với ngoại lệ `Missing item_id or user_submission`.

---

#### 🔹 TC-16: Interactive Quiz Generation, Auto-Scoring & Global Leaderboard
* **Mục tiêu**: Kiểm tra toàn bộ chu trình bài thi trắc nghiệm (Interactive Quiz): sinh câu hỏi ngẫu nhiên từ ngân hàng từ vựng/kỹ thuật, nộp bài tự động tính điểm chuẩn hóa (thang 10), ghi nhận lịch sử và hiển thị bảng xếp hạng Leaderboard.
* **Tiền điều kiện**: Ngân hàng câu hỏi/từ vựng có dữ liệu.
* **Các bước thực hiện**:
  1. `GET /api/learning/quiz/generate?topic_no=1&count=5`: Sinh 5 câu hỏi trắc nghiệm ngẫu nhiên.
  2. `POST /api/learning/quiz/submit`: Nộp bài làm trắc nghiệm kèm chi tiết đáp án.
  3. `GET /api/learning/quiz/leaderboard`: Xem bảng xếp hạng điểm cao.
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 200, 5 câu hỏi có danh sách 4 lựa chọn A, B, C, D đã được xáo trộn ngẫu nhiên.
  * Bước 2: HTTP 200, tính điểm chuẩn hóa `normalizedScore`, ghi nhận vào bảng `quiz_results`.
  * Bước 3: HTTP 200, danh sách bảng xếp hạng hiển thị học viên đạt điểm cao nhất.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Generator sinh bộ đề 5 câu, mỗi câu có đầy đủ 4 options trắc nghiệm.
    - Nộp bài làm đúng 4/5 câu được quy đổi điểm chuẩn hóa chính xác `normalizedScore = 8.0`.

---

#### 🔹 TC-17: Practice Exam Builder & Simulation Submission
* **Mục tiêu**: Kiểm tra tính năng tạo đề thi thử toàn diện (Practice Exam) kết hợp nhiều loại bài học (Tech Fundamentals, Reading, Vocabulary, Listening) theo tỷ lệ câu hỏi khó/trung bình/dễ, áp dụng thuật toán Adaptive Selector dựa trên lịch sử năng lực học viên.
* **Tiền điều kiện**: Bể câu hỏi phong phú có gắn nhãn difficulty (`easy`, `medium`, `hard`).
* **Các bước thực hiện**:
  1. `GET /api/learning/practice-exam?category=tech&count=10`: Tạo bộ đề 10 câu.
  2. Kiểm tra bộ đề có phân bổ đúng cấu trúc độ khó (`levels: { easy, medium, hard }`).
  3. `POST /api/learning/practice-exam/submit`: Gửi kết quả thi thử để cập nhật trọng số Adaptive.
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 200, danh sách câu hỏi tổng hợp và tóm tắt cấp độ câu hỏi.
  * Bước 3: HTTP 200 `{ ok: true, recorded: 10 }`, ghi nhận kết quả phục vụ thuật toán thích ứng lần sau.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Bộ đề 3 câu được sinh từ pool phân loại chính xác các tầng độ khó `easy: 2, medium: 1`.
    - Trả về tổng số câu hỏi `total === 3` và danh sách câu hỏi tương ứng.

---

#### 🔹 TC-18: Content Ingestion, AI Batch Generation & Excel Sync
* **Mục tiêu**: Kiểm tra tính năng quản trị nội dung của Dan-Learning: dùng AI tạo hàng loạt câu hỏi/từ vựng mới theo chủ đề, lưu hàng loạt vào DB (`save-batch`), xuất dữ liệu ra file Excel và import nội dung từ file Excel.
* **Tiền điều kiện**: Quyền Admin.
* **Các bước thực hiện**:
  1. `POST /api/learning/ai/generate`: Yêu cầu AI sinh 3 từ vựng mới theo chủ đề.
  2. `POST /api/learning/ai/save-batch`: Lưu 3 item do AI sinh vào chủ đề bài học.
  3. `GET /api/learning/export/nodejs`: Xuất toàn bộ bài học ra file Excel `.xlsx`.
  4. `POST /api/learning/import/:id`: Đọc và nạp dữ liệu từ file Excel vào database.
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 200, trả về mảng các câu hỏi/từ vựng do AI tạo.
  * Bước 2: HTTP 200 `{ ok: true, count: 3, ids: [...] }`.
  * Bước 3: HTTP 200, Header `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  * Bước 4: HTTP 200, nạp dữ liệu thành công từ file Excel.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - AI sinh thành công batch 3 items với đầy đủ title, prompt và sample_solution.
    - `saveBatch` gán và trả về 3 ID mới `[200, 201, 202]`, số lượng đếm `count === 3`.

---

### ─── PHẦN 6: TƯƠNG TÁC VỚI OPENCLAW (MULTI-AGENT SCRAPER & WORKFLOWS) ───

#### 🔹 TC-19: OpenClaw Multi-Agent Cluster Overview & SOP Dispatch
* **Mục tiêu**: Đảm bảo Dan-API kết nối đồng bộ và giám sát cụm OpenClaw (`openclaw.hpdev.name.vn:4000`), theo dõi tình trạng các worker Agent Playwright, và gửi lệnh điều khiển trạng thái (start / pause / resume / trigger SOP).
* **Tiền điều kiện**: Cấu hình `OPENCLAW_URL` và `OPENCLAW_SECRET` trong môi trường.
* **Các bước thực hiện**:
  1. `GET /api/openclaw/overview`: Xem trạng thái tổng thể cụm OpenClaw.
  2. `GET /api/openclaw/agents`: Lấy danh sách các agent cào dữ liệu.
  3. `POST /api/openclaw/agents/crawler-jobs/control`: Gửi lệnh điều khiển trạng thái Agent.
* **Kết quả kỳ vọng**:
  * Bước 1: HTTP 200, trạng thái kết nối server OpenClaw (health, activeWorkers, pendingTasks).
  * Bước 2: HTTP 200, danh sách agents kèm trạng thái `idle` / `running` / `paused`.
  * Bước 3: HTTP 200, lệnh điều khiển được OpenClaw tiếp nhận và chuyển đổi trạng thái an toàn.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Cụm OpenClaw phản hồi `health: 'ok'` với 4 active workers.
    - Điều khiển chuyển trạng thái agent `agent-fb-scraper` từ `idle` sang `running` thành công, trạng thái mới ghi nhận `currentState: 'running'`.

---

#### 🔹 TC-20: OpenClaw Workflow Audit & Service-to-Service Discord Webhook
* **Mục tiêu**: Kiểm tra chức năng kiểm toán các luồng công việc (Workflows) của OpenClaw, tra cứu log thực thi chi tiết, và tiếp nhận Webhook bảo mật (ServiceAuth Secret) từ OpenClaw để tự động bắn thông báo kết quả cào dữ liệu về Discord.
* **Tiền điều kiện**: Khóa bí mật ServiceAuth được cấu hình đồng bộ giữa hai hệ thống.
* **Các bước thực hiện**:
  1. `GET /api/openclaw/workflows?limit=10&state=completed`: Xem 10 quy trình cào dữ liệu đã hoàn tất.
  2. `GET /api/openclaw/workflows/wf-98124`: Xem nhật ký chi tiết các bước cào dữ liệu.
  3. `POST /api/integrations/openclaw/discord-notifications` với Header `x-service-auth` hợp lệ: Kiểm tra tiếp nhận webhook và gửi thông báo Discord.
  4. Gửi request webhook với Header `x-service-auth` không hợp lệ.
* **Kết quả kỳ vọng**:
  * Bước 1 & 2: HTTP 200, danh sách và chi tiết workflow với đầy đủ log và thống kê.
  * Bước 3: HTTP 200 `{ ok: true, message: "Discord notification queued" }`.
  * Bước 4: HTTP 401 hoặc 403 Unauthorized, chặn ngay request trái phép.
* **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  * **Bằng chứng (Evidence)**:
    - Request gửi với secret giả mạo `invalid_secret` bị ServiceAuth chặn ngay lập tức với lỗi `Unauthorized Service Request`.
    - Request mang secret hợp lệ được tiếp nhận, đẩy thông báo vào `discordQueue` với 150 tin crawl được xếp hàng thành công.

---

## 🏆 BÁO CÁO KẾT QUẢ THỰC THI KIỂM THỬ (TEST EXECUTION REPORT)

* **Thời gian thực hiện**: `2026-10-02 10:51:24`
* **Môi trường**: NodeJS `v20.x`, ExpressJS Framework, Jest Test Runner `v29.7.0`
* **Kết quả tổng thể**:
  * **Tổng số kịch bản**: **20 / 20**
  * **Số kịch bản đạt (PASS)**: **20 (100%)**
  * **Số kịch bản lỗi (FAIL)**: **0 (0%)**
* **Kết quả toàn bộ Suite dan-api**: **48 / 48 suites passed, 249 / 249 tests passed**
