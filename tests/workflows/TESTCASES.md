# 🦞 BỘ 20 KỊCH BẢN KIỂM THỬ TOÀN DIỆN (ALL WORKFLOWS) CHO DAN-OPENCLAW v2.0.0

> **Phân hệ**: Autonomous Multi-Agent Engine & Orchestrator (`openclaw`)  
> **Kiến trúc**: Clean Architecture, SOLID Principles, 5 Domain Agents (`dan_rnd`, `dan_logistics`, `dan_cfo`, `dan_ops`, `dan_cskh`), Multi-AI Routing (`dan-api`), AI Training & Memory Loop (`dan-learning`), CEO Cockpit (`dan-manager`), Playwright Browser Automation & Web Crawler.  
> **Thư mục lưu trữ**: `dan_ai/openclaw/tests/workflows/`  
> **Tệp thực thi tự động**: `node tests/workflows/test_scenarios.spec.js` hoặc `npm test`  
> **Mục tiêu**: Đưa OpenClaw trở thành một autonomous orchestrator thực thụ với khả năng tiếp nhận sự kiện, điều phối tác vụ song song, tự động phân tích rủi ro, xin phê duyệt CEO, tương tác liên phòng ban và tự học hỏi qua vòng lặp phản hồi.

---

## 📊 BẢNG TỔNG HỢP MA TRẬN 20 TEST CASE

| Mã TC | Phân hệ / Workflow | Tên Kịch Bản Kiểm Thử | Endpoint / Service Chính | Mức Độ Ưu Tiên | Trạng Thái |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **TC-01** | **Security & Ingestion** | Xác thực Webhook HMAC-SHA256 & Tiếp nhận Signed Ecommerce Event | `POST /orchestrator/v1/events` | **P0 (Critical)** | ✅ **PASS** |
| **TC-02** | **Security & Ingestion** | Chống trùng lặp sự kiện (Idempotency & Deduplication Engine) | `POST /orchestrator/v1/events` | **P0 (Critical)** | ✅ **PASS** |
| **TC-03** | **Domain Agent: R&D** | Workflow Đần R&D (`dan_rnd`) - Phân tích xu hướng thị trường & Đề xuất công thức | `RndAgent.handleTrendEvent()` | **P1 (High)** | ✅ **PASS** |
| **TC-04** | **Domain Agent: Logistics** | Workflow Đần Logistics (`dan_logistics`) - Cảnh báo tồn kho & Lập Purchase Order | `LogisticsAgent.handleStockAlert()` | **P0 (Critical)** | ✅ **PASS** |
| **TC-05** | **Domain Agent: CFO** | Workflow Đần CFO (`dan_cfo`) - Đối soát tài chính, phát hiện chênh lệch & Phân loại rủi ro | `CfoAgent.handleReconciliation()` | **P0 (Critical)** | ✅ **PASS** |
| **TC-06** | **Domain Agent: Ops** | Workflow Đần Ops (`dan_ops`) - Giám sát đơn hàng thời gian thực & Xử lý sự cố SLA | `OpsAgent.handleSlaViolation()` | **P0 (Critical)** | ✅ **PASS** |
| **TC-07** | **Domain Agent: CSKH** | Workflow Đần CSKH (`dan_cskh`) - Phân tích đánh giá tiêu cực & Đề xuất Voucher | `CskhAgent.handleNegativeReview()` | **P1 (High)** | ✅ **PASS** |
| **TC-08** | **Dan-Manager Integration** | Quy trình xin CEO phê duyệt (Approval Request & Decision Loop) | `POST /approvals/:id/decision` | **P0 (Critical)** | ✅ **PASS** |
| **TC-09** | **Dan-Manager Integration** | Lệnh dừng khẩn cấp (Emergency Stop) & Khôi phục (Resume) từ Manager | `POST /control/emergency-stop`, `resume`| **P0 (Critical)** | ✅ **PASS** |
| **TC-10** | **Dan-Manager Integration** | Điều chỉnh Cấp độ Tự trị (Autonomy Level & Guardrails Policy) | `POST /control/level` | **P1 (High)** | ✅ **PASS** |
| **TC-11** | **Dan-Manager Integration** | Replay Workflow & Điều tra nguyên nhân gốc không tạo side-effect | `POST /control/replay` | **P1 (High)** | ✅ **PASS** |
| **TC-12** | **Dan-Learning Integration** | Trích xuất bộ nhớ ngắn hạn & Chuyển vào Kho lưu trữ dài hạn (Memory Extractor) | `MemoryExtractorService.extract()` | **P1 (High)** | ✅ **PASS** |
| **TC-13** | **Dan-Learning Integration** | Ghi nhận Lịch sử đào tạo AI, Đồng bộ dữ liệu học & Đánh giá năng lực | `HistoryStoreService.logTraining()` | **P1 (High)** | ✅ **PASS** |
| **TC-14** | **Dan-Learning Integration** | Vòng lặp Tự cải tiến từ phản hồi (Feedback Loop & Prompt Optimization) | `FeedbackLoopService.recordFeedback()` | **P1 (High)** | ✅ **PASS** |
| **TC-15** | **Dan-Api Integration** | Điều phối Multi-Provider LLM & Cơ chế dự phòng Failover (Gemini/Claude/GPT) | `MultiProviderAdapter.complete()` | **P0 (Critical)** | ✅ **PASS** |
| **TC-16** | **Dan-Api Integration** | Giám sát Token Metering, Đo lường ngân sách & Giới hạn chi phí (Budget Enforcer) | `TokenService`, `BudgetPolicy` | **P1 (High)** | ✅ **PASS** |
| **TC-17** | **Autonomous Web Tools** | Năng lực Web Autonomous: Tìm kiếm thị trường (Search) & Trích xuất nội dung (Fetch) | `POST /tools/search`, `POST /tools/fetch` | **P0 (Critical)** | ✅ **PASS** |
| **TC-18** | **Autonomous Web Tools** | Năng lực Web Autonomous: Thu thập dữ liệu đối thủ đa tầng (Deep Crawl Engine) | `POST /tools/crawl` | **P1 (High)** | ✅ **PASS** |
| **TC-19** | **Autonomous Web Tools** | Năng lực Trình duyệt: Tự động hóa tác vụ headless với Playwright Sandbox | `POST /tools/automate` | **P0 (Critical)** | ✅ **PASS** |
| **TC-20** | **Resilience & Reporting** | Hộp thư ngoại lệ (Exception Inbox), Dead-Letter Queue & Báo cáo tổng hợp CEO | `POST /commands/daily-report`, DLQ | **P0 (Critical)** | ✅ **PASS** |

---

## 🔍 CHI TIẾT 20 KỊCH BẢN KIỂM THỬ VÀ BẰNG CHỨNG THỰC TẾ

### PHẦN 1: BẢO MẬT & TIẾP NHẬN SỰ KIỆN (SECURITY & INGESTION)

#### TC-01: Xác thực Webhook HMAC-SHA256 & Tiếp nhận Signed Ecommerce Event
- **Phân hệ**: Security Middleware & Ingestion (`src/middleware/webhook-verification.middleware.js`, `src/policy/permissions/signature.policy.js`)
- **Mục tiêu**: Đảm bảo mọi event từ SSOT Ecommerce phải được ký số hợp lệ bằng HMAC-SHA256, từ chối mọi request không hợp lệ hoặc có dấu hiệu tấn công replay.
- **Tiền điều kiện**: OpenClaw đang chạy, secret key cấu hình đồng bộ giữa SSOT và OpenClaw (`env.API_SECRET`).
- **Các bước thực hiện**:
  1. Tạo payload sự kiện: `event_name = 'order.paid'`, `order_id = 'ORD-2026-099'`.
  2. Ký HMAC-SHA256 payload với secret key hợp lệ, sinh `x-signature-sha256`.
  3. Gửi request `POST /orchestrator/v1/events` với header chữ ký.
  4. Gửi request thứ 2 với chữ ký sai hoặc header timestamp lệch quá 300 giây.
- **Kết quả mong đợi**:
  - Request 1: Chữ ký hợp lệ, HTTP status `200 OK`, event được đưa vào hàng đợi xử lý.
  - Request 2: Trả về HTTP `401 Unauthorized` hoặc `403 Forbidden`, event bị hủy ngay lập tức và ghi nhận cảnh báo bảo mật vào audit log.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Thuật toán `crypto.timingSafeEqual` xác thực hash chuẩn xác, ngăn chặn timing attacks.
    - Phát hiện và chặn replay attack khi độ lệch timestamp `> 300,000ms`.

---

#### TC-02: Chống trùng lặp sự kiện (Idempotency & Deduplication Engine)
- **Phân hệ**: Workflow Engine & Deduplication (`src/services/workflow/idempotency.service.js`)
- **Mục tiêu**: Ngăn chặn tình trạng cùng một sự kiện (webhook retry từ bên ngoài) tạo ra nhiều workflow thực thi song song, gây lãng phí tài nguyên hoặc sai lệch dữ liệu.
- **Tiền điều kiện**: Sự kiện `inventory.alert` đã được xử lý thành công trước đó với correlationId `corr-alert-991`.
- **Các bước thực hiện**:
  1. Gửi sự kiện ban đầu kèm correlationId `corr-alert-991`. Hệ thống khởi tạo workflow `wf-991`.
  2. Gửi lại chính xác sự kiện đó với cùng correlationId trong vòng 24 giờ.
- **Kết quả mong đợi**:
  - Hệ thống phát hiện correlationId đã tồn tại trong bảng lưu vết.
  - Không tạo thêm bất kỳ workflow mới nào.
  - Phản hồi HTTP `200 OK` kèm cờ `{ duplicate: true, originalWorkflowId: 'wf-991' }`.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Lần chạy 1 sinh `workflowId`, trả về `{ duplicate: false, status: 'INITIALIZED' }`.
    - Lần chạy 2 trả về `{ duplicate: true, status: 'SKIPPED_DUPLICATE' }` cùng `workflowId` gốc.

---

### PHẦN 2: ĐIỀU PHỐI 5 DOMAIN AI AGENTS (MULTI-AGENT ORCHESTRATION)

#### TC-03: Workflow Đần R&D (`dan_rnd`) - Phân tích xu hướng thị trường & Đề xuất công thức
- **Phân hệ**: Domain Agent R&D (`src/services/ai/agents/rnd.agent.js`, `src/services/ai/research`)
- **Mục tiêu**: Tự động tìm kiếm xu hướng thị trường về F&B / Ecommerce, tổng hợp insight và tạo bản đề xuất sản phẩm mới gửi đến SSOT.
- **Tiền điều kiện**: Agent `dan_rnd` đã được đăng ký trong `AgentRegistry`, trạng thái `active`.
- **Các bước thực hiện**:
  1. Nhận sự kiện `rnd.trend_hunt_requested` với từ khóa `"trà sữa nướng ô long 2026"`.
  2. `dan_rnd` gọi web search thu thập các bài viết đánh giá thị trường.
  3. LLM phân tích thị hiếu, sinh công thức món mới (nguyên liệu, tỉ lệ, giá thành ước tính).
  4. Tạo proposal trạng thái `PROPOSED` kèm báo cáo phân tích.
- **Kết quả mong đợi**:
  - Proposal có đầy đủ `recipe_name`, `ingredients`, `margin_estimate > 40%`.
  - Ghi nhận audit trail cho tác vụ của `dan_rnd`.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Proposal sinh ra với 3 nguyên liệu: Cốt trà Ô long rang, Sữa tươi thanh trùng, Topping Macchiato phô mai.
    - Biên lợi nhuận gộp đạt 71% (> 40% tiêu chuẩn).

---

#### TC-04: Workflow Đần Logistics (`dan_logistics`) - Cảnh báo tồn kho & Lập Purchase Order
- **Phân hệ**: Domain Agent Logistics (`src/services/ai/agents/logistics.agent.js`)
- **Mục tiêu**: Nhận diện nguyên vật liệu dưới ngưỡng tồn kho an toàn, tính toán chu kỳ đặt hàng và lập đề xuất phiếu mua hàng (PO).
- **Tiền điều kiện**: Tồn kho mặt hàng `MAT-MATCHA-JP` còn 8kg (ngưỡng an toàn là 20kg, lead time 7 ngày).
- **Các bước thực hiện**:
  1. Tiếp nhận sự kiện `inventory.low_stock` từ kho vận SSOT.
  2. `dan_logistics` truy vấn lịch sử tiêu thụ và lead time nhà cung cấp.
  3. Tính toán số lượng cần nhập bù: 32kg.
  4. Tạo Purchase Proposal với nhà cung cấp tối ưu.
- **Kết quả mong đợi**:
  - Sinh PO DTO hoàn chỉnh: `item_id: 'MAT-MATCHA-JP'`, `quantity: 32`, `totalPriceVND: 16000000`.
  - Phân loại mức độ rủi ro (Risk Level: `HIGH` do > 10,000,000 VND).
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Cảnh báo ở mức `CRITICAL`, tính toán đúng số lượng bù 32kg.
    - Phân loại `riskLevel: 'HIGH'` chuyển sang hàng chờ duyệt CEO.

---

#### TC-05: Workflow Đần CFO (`dan_cfo`) - Đối soát tài chính, phát hiện chênh lệch & Phân loại rủi ro
- **Phân hệ**: Domain Agent CFO (`src/services/ai/agents/cfo.agent.js`, `src/policy/permissions/risk.policy.js`)
- **Mục tiêu**: Tự động đối soát bảng kê thanh toán cổng thanh toán với đơn hàng SSOT; phân loại yêu cầu hoàn tiền tự động hoặc xin duyệt.
- **Tiền điều kiện**: Cấu hình ngưỡng duyệt tự động `AUTO_APPROVE_LIMIT = 200,000 VND`.
- **Các bước thực hiện**:
  1. Kiểm tra trường hợp hoàn tiền nhỏ: 50,000 VND.
  2. Kiểm tra trường hợp hoàn tiền lớn: 1,500,000 VND.
- **Kết quả mong đợi**:
  - Giao dịch 50,000 VND: Tự động phê duyệt (`AUTO_REFUND`, rủi ro `LOW`).
  - Giao dịch 1,500,000 VND: Yêu cầu chuyển CEO phê duyệt (`ESCALATE_TO_CEO`, rủi ro `HIGH`).
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Giao dịch nhỏ tự động thông qua không cần CEO can thiệp.
    - Giao dịch lớn kích hoạt cờ `requiresCeoApproval = true`.

---

#### TC-06: Workflow Đần Ops (`dan_ops`) - Giám sát đơn hàng thời gian thực & Xử lý sự cố SLA
- **Phân hệ**: Domain Agent Ops (`src/services/ai/agents/ops.agent.js`, `src/services/workflow/action/workflow-fallback.service.js`)
- **Mục tiêu**: Phát hiện đơn hàng bị nghẽn chế biến hoặc giao trễ vượt thời gian cam kết (SLA 20 phút), tự động can thiệp điều phối.
- **Tiền điều kiện**: Đơn hàng `ORD-LIVE-088` đã đặt từ 35 phút trước (trễ 15 phút).
- **Các bước thực hiện**:
  1. Trigger sự kiện kiểm tra tiến độ đơn hàng.
  2. `dan_ops` xác nhận vi phạm SLA.
  3. Kích hoạt chuỗi hành động dự phòng (fallback actions).
- **Kết quả mong đợi**:
  - Ghi nhận `slaBreached: true`, độ trễ 15 phút.
  - Khởi tạo 3 hành động khắc phục: Báo ưu tiên bếp, gọi shipper hỏa tốc, soạn thư xin lỗi khách hàng.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Kích hoạt chuẩn xác mảng `fallbackActions` đầy đủ 3 bước không làm gián đoạn hệ thống.

---

#### TC-07: Workflow Đần CSKH (`dan_cskh`) - Phân tích đánh giá tiêu cực & Đề xuất Voucher
- **Phân hệ**: Domain Agent CSKH (`src/services/ai/agents/cskh.agent.js`)
- **Mục tiêu**: Đọc đánh giá 1 sao của khách hàng, phân tích nguyên nhân gốc và soạn thư xin lỗi kèm voucher đền bù.
- **Tiền điều kiện**: Khách hàng để lại đánh giá 1 sao với phản hồi giao trễ, nước đá tan.
- **Các bước thực hiện**:
  1. Phân loại cảm xúc văn bản: `VERY_NEGATIVE`.
  2. Bóc tách nguyên nhân cốt lõi: `DELIVERY_DELAY`, `FOOD_QUALITY`.
  3. Tạo dự thảo phản hồi và đề xuất mã giảm giá 40%.
- **Kết quả mong đợi**:
  - Câu trả lời lịch sự, chuyên nghiệp.
  - Mã voucher đền bù `DANCARE40` hợp lệ.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Trả về object DTO CSKH chuẩn format gồm `sentiment`, `rootCauses`, `proposedCompensation`.

---

### PHẦN 3: TƯƠNG TÁC VỚI DAN-MANAGER (CEO COCKPIT & OPERATOR CONTROLS)

#### TC-08: Quy trình xin CEO phê duyệt (Approval Request & Decision Loop)
- **Phân hệ**: Approval Management (`src/controllers/approval.controller.js`, `src/repositories/approval.repository.js`)
- **Mục tiêu**: Khi một agent tạo hành động có mức rủi ro cao, workflow tạm dừng ở trạng thái `AWAITING_APPROVAL`, chờ quyết định từ CEO qua Dan-Manager.
- **Tiền điều kiện**: Workflow `wf-po-101` đang chờ duyệt phiếu mua hàng.
- **Các bước thực hiện**:
  1. CEO trên Dan-Manager gửi request phê duyệt `APPROVED` kèm lý do và tên người duyệt.
  2. Cập nhật trạng thái workflow sang `IN_PROGRESS`.
- **Kết quả mong đợi**:
  - Trạng thái approval cập nhật thành `APPROVED`.
  - Workflow chuyển tiếp sang `IN_PROGRESS` để thực thi hành động kế tiếp.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Quyết định được ký bởi `ceo_admin`, ghi nhận thời gian `decidedAt` và kích hoạt state machine.

---

#### TC-09: Lệnh dừng khẩn cấp (Emergency Stop) & Khôi phục (Resume) từ Manager
- **Phân hệ**: Operator Control (`src/controllers/operator.controller.js`, `src/services/operator/emergency-stop.service.js`)
- **Mục tiêu**: Cho phép Quản trị viên kích hoạt nút ngắt khẩn cấp ngay lập tức đình chỉ mọi hành động tác động ra bên ngoài khi phát hiện sự cố hệ thống.
- **Tiền điều kiện**: Hệ thống đang ở trạng thái `RUNNING`.
- **Các bước thực hiện**:
  1. Kích hoạt `triggerEmergencyStop('admin_dan_manager')`.
  2. Kiểm tra cờ cho phép thực thi tác vụ (`canExecuteAgentAction`).
  3. Kích hoạt `triggerResume('admin_dan_manager')`.
- **Kết quả mong đợi**:
  - Khi Stop: Hệ thống chuyển `STOPPED`, mọi tác vụ bị chặn (`canExecute = false`).
  - Khi Resume: Hệ thống trở về `RUNNING`, cho phép tiếp tục hoạt động.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Kiểm soát trạng thái hệ thống hoàn toàn đồng bộ, ghi nhận operator kích hoạt.

---

#### TC-10: Điều chỉnh Cấp độ Tự trị (Autonomy Level & Guardrails Policy)
- **Phân hệ**: Autonomy Governance (`src/services/ai/agents/agent-autonomy.service.js`)
- **Mục tiêu**: Kiểm tra khả năng cấu hình 4 cấp độ tự trị từ Dan-Manager: `L1_MANUAL`, `L2_SUPERVISED`, `L3_SEMI_AUTONOMOUS`, `L4_FULL_AUTONOMOUS`.
- **Tiền điều kiện**: Cấu hình chính sách hạn mức tự trị theo từng level.
- **Các bước thực hiện**:
  1. Kiểm tra giao dịch 500,000 VND ở L1 (thủ công) và L3 (bán tự trị).
  2. Kiểm tra giao dịch 5,000,000 VND ở L3 và L4 (toàn quyền tự trị).
- **Kết quả mong đợi**:
  - L1 chặn 500k; L3 duyệt 500k.
  - L3 chặn 5tr; L4 duyệt 5tr.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Ma trận logic tự trị phản ánh đúng policy guardrails từng cấp độ.

---

#### TC-11: Replay Workflow & Điều tra nguyên nhân gốc không tạo side-effect
- **Phân hệ**: Replay Engine (`src/services/operator/replay.service.js`)
- **Mục tiêu**: Tái hiện từng bước suy luận và quyết định của AI trong một sự cố quá khứ mà không gọi lại các API external thật (`dryRun: true`).
- **Tiền điều kiện**: Có audit log của workflow gặp lỗi timeout.
- **Các bước thực hiện**:
  1. Kích hoạt `replayWorkflow(historicalAuditLog, isDryRun: true)`.
  2. Kiểm tra số lượng external API call phát sinh và nguyên nhân gốc tái hiện.
- **Kết quả mong đợi**:
  - `externalCallsMade === 0`.
  - Tái hiện chính xác nguyên nhân `TIMEOUT_504`.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - 3 bước được replay hoàn chỉnh, không gây side-effect ra môi trường bên ngoài.

---

### PHẦN 4: TƯƠNG TÁC VỚI DAN-LEARNING (AI MEMORY & TRAINING HISTORY)

#### TC-12: Trích xuất bộ nhớ ngắn hạn & Chuyển vào Kho lưu trữ dài hạn (Memory Extractor)
- **Phân hệ**: Curated Memory Service (`src/services/ai/memory/memory-extractor.service.js`, `curated-memory.service.js`)
- **Mục tiêu**: Tự động trích lọc các tri thức quan trọng từ hội thoại lưu vào bộ nhớ lâu dài và lọc bỏ PII (số điện thoại, email).
- **Tiền điều kiện**: Hội thoại chứa số điện thoại khách hàng `0987654321`.
- **Các bước thực hiện**:
  1. Lọc thông tin nhạy cảm (PII Redaction).
  2. Trích xuất quy tắc nghiệp vụ CSKH mới.
- **Kết quả mong đợi**:
  - Số điện thoại bị thay thế bằng `[REDACTED_PHONE]`.
  - Quy tắc `GIFT_TOPPING_PEARL` được lưu trữ với độ tin cậy 0.95.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Văn bản sạch không còn PII, tri thức được đóng gói dạng DTO cấu trúc chuẩn.

---

#### TC-13: Ghi nhận Lịch sử đào tạo AI, Đồng bộ dữ liệu học & Đánh giá năng lực
- **Phân hệ**: AI Training History & Analytics (`src/services/ai/memory/history-store.service.js`)
- **Mục tiêu**: Lưu lại lịch sử suy luận, token tiêu thụ, điểm critic và xuất dataset dạng JSONL chuẩn phục vụ fine-tuning trên Dan-Learning.
- **Tiền điều kiện**: Có dữ liệu phiên làm việc của các agent.
- **Các bước thực hiện**:
  1. Tổng hợp telemetry các phiên.
  2. Xuất dữ liệu ra định dạng JSON Lines.
- **Kết quả mong đợi**:
  - File JSONL trích xuất đạt tiêu chuẩn: `agent_id`, `total_tokens`, `quality_score`.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Parse thành công từng dòng JSONL, tổng số token và điểm critic được lưu toàn vẹn.

---

#### TC-14: Vòng lặp Tự cải tiến từ phản hồi (Feedback Loop & Prompt Optimization)
- **Phân hệ**: Feedback Loop Service (`src/services/ai/research/feedback-loop.service.js`)
- **Mục tiêu**: Khi CEO từ chối proposal vì lý do cụ thể, tự động ghi nhận làm bài học kinh nghiệm (Lesson Learned) tiêm vào prompt ở các lần chạy sau.
- **Tiền điều kiện**: Đề xuất bị từ chối với critique `PRICE_TOO_HIGH`.
- **Các bước thực hiện**:
  1. Ghi nhận phản hồi tiêu cực.
  2. Tối ưu hóa prompt bằng cách bổ sung chỉ dẫn khống chế giá vốn nguyên liệu.
- **Kết quả mong đợi**:
  - Prompt mới tự động bổ sung khối `[LESSON_LEARNED]`.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Prompt đầu ra chứa nội dung: `không vượt quá 30% giá bán`.

---

### PHẦN 5: TƯƠNG TÁC VỚI DAN-API (MODEL PROVIDER & BUDGET ENFORCER)

#### TC-15: Điều phối Multi-Provider LLM & Cơ chế dự phòng Failover (Gemini/Claude/GPT)
- **Phân hệ**: AI Multi-Provider Adapter (`src/services/ai/router`, `src/services/workflow/action/workflow-fallback.service.js`)
- **Mục tiêu**: Kết nối với `dan-api` để gọi các mô hình AI khác nhau; tự động failover sang mô hình phụ khi mô hình chính gặp lỗi Rate Limit (429) hoặc Timeout.
- **Tiền điều kiện**: Gemini trả về lỗi 429 Too Many Requests.
- **Các bước thực hiện**:
  1. Gọi hàm điều phối với mô hình chính.
  2. Bắt lỗi 429 và tự động kích hoạt gọi Claude dự phòng.
- **Kết quả mong đợi**:
  - Không ném lỗi ra ngoài làm crash workflow.
  - Trả về kết quả từ Claude kèm cờ `failoverTriggered: true`.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Cơ chế failover kích hoạt mượt mà, trả về phản hồi hợp lệ cho agent.

---

#### TC-16: Giám sát Token Metering, Đo lường ngân sách & Giới hạn chi phí (Budget Enforcer)
- **Phân hệ**: Token Service & Budget Policy (`src/services/token.service.js`, `src/services/budget`)
- **Mục tiêu**: Kiểm soát chi phí gọi AI theo từng phòng ban/agent, ngăn chặn hiện tượng lặp vô tận làm cạn kiệt ngân sách.
- **Tiền điều kiện**: Hạn mức ngày 100,000 tokens, đã tiêu thụ 96,000 tokens.
- **Các bước thực hiện**:
  1. Yêu cầu tác vụ 5,000 tokens -> Kiểm tra chặn vượt hạn mức.
  2. Yêu cầu tác vụ 2,000 tokens -> Kiểm tra cho phép thực thi.
- **Kết quả mong đợi**:
  - Tác vụ 5k tokens bị từ chối với mã `DAILY_BUDGET_EXCEEDED`.
  - Tác vụ 2k tokens được chấp thuận, cập nhật bộ đếm lên 98,000 tokens.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Giới hạn ngân sách bảo vệ tuyệt đối hạn ngạch token trong ngày.

---

### PHẦN 6: NĂNG LỰC WEB & TỰ ĐỘNG HÓA THỰC THỤ (AUTONOMOUS WEB TOOLS)

#### TC-17: Năng lực Web Autonomous: Tìm kiếm thị trường (Search) & Trích xuất nội dung (Fetch)
- **Phân hệ**: Web Search & Fetch Tools (`src/services/web/search.service.js`, `src/services/web/fetch.service.js`)
- **Mục tiêu**: Đảm bảo OpenClaw hoạt động như một crawler thực thụ, tìm kiếm thông tin theo từ khóa và bóc tách nội dung HTML sạch từ URL đích.
- **Tiền điều kiện**: Module search và fetch đã kích hoạt.
- **Các bước thực hiện**:
  1. Tìm kiếm thị trường theo từ khóa.
  2. Lấy URL kết quả đầu tiên và fetch nội dung văn bản sạch.
- **Kết quả mong đợi**:
  - Trả về danh sách kết quả tìm kiếm gồm title, url, snippet.
  - Nội dung fetch đã loại bỏ hoàn toàn các thẻ HTML rác.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Văn bản bóc tách chuẩn xác: `"Giá cà phê hôm nay Nội dung chính sạch sẽ."`.

---

#### TC-18: Năng lực Web Autonomous: Thu thập dữ liệu đối thủ đa tầng (Deep Crawl Engine)
- **Phân hệ**: Web Crawl Engine (`src/services/web/crawl.service.js`)
- **Mục tiêu**: Thu thập thông tin sản phẩm đa trang từ website đối thủ, hỗ trợ giới hạn độ sâu (depth), số lượng trang (maxPages).
- **Tiền điều kiện**: URL mục tiêu có sơ đồ liên kết phân tầng.
- **Các bước thực hiện**:
  1. Kích hoạt crawl với `maxDepth = 2, maxPages = 3`.
  2. Kiểm tra hàng đợi thu thập và danh sách trang đã ghé thăm.
- **Kết quả mong đợi**:
  - Thu thập chính xác 3 trang, không trang nào vượt độ sâu 2.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - `pagesCrawled === 3`, `every(item.depth <= 2)` thỏa mãn 100%.

---

#### TC-19: Năng lực Trình duyệt: Tự động hóa tác vụ headless với Playwright Sandbox
- **Phân hệ**: Browser Automation (`src/services/web/automate.service.js`, `src/services/sandbox`)
- **Mục tiêu**: Mở trình duyệt Chromium trong môi trường sandbox an toàn, thực hiện click nút, điền form hoặc chụp ảnh màn hình theo kịch bản.
- **Tiền điều kiện**: Danh mục hành động cho phép: `navigate, click, fill, screenshot, wait`.
- **Các bước thực hiện**:
  1. Xác thực kịch bản hợp lệ sử dụng HTTPS.
  2. Xác thực kịch bản vi phạm sử dụng HTTP không an toàn.
- **Kết quả mong đợi**:
  - Kịch bản HTTPS được duyệt hợp lệ.
  - Kịch bản HTTP bị chặn với lỗi chính sách sandbox.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Sandbox Policy bảo vệ an toàn trình duyệt headless.

---

### PHẦN 7: XỬ LÝ NGOẠI LỆ, GIÁM SÁT & BÁO CÁO (ENTERPRISE RESILIENCE)

#### TC-20: Hộp thư ngoại lệ (Exception Inbox), Dead-Letter Queue & Báo cáo tổng hợp CEO
- **Phân hệ**: Resilience & Reporting (`src/controllers/ceo.controller.js`, `src/services/workflow/dead-letter-ui.service.js`, `src/services/reporting/aggregator.service.js`)
- **Mục tiêu**: Tác vụ lỗi sau khi hết lượt thử được đưa vào Dead-Letter Queue và Exception Inbox; tổng hợp chỉ số hoạt động cả ngày gửi 1 báo cáo duy nhất cho CEO.
- **Tiền điều kiện**: Có workflow thất bại do mất kết nối SSOT ngoài; cả 5 agent hoàn thành các tác vụ trong ngày.
- **Các bước thực hiện**:
  1. Đưa lỗi vào hàng đợi DLQ.
  2. Tạo báo cáo ngày tổng hợp cho cả 5 agent (`dan_rnd`, `dan_logistics`, `dan_cfo`, `dan_ops`, `dan_cskh`).
- **Kết quả mong đợi**:
  - Exception được lưu vào DLQ với trạng thái `UNRESOLVED`.
  - Báo cáo ngày bao gồm 5 phòng ban, cờ `singleMessageDelivered: true`.
- **Kết quả thực tế (Actual Result)**: ✅ **PASS**
  - **Bằng chứng (Evidence)**:
    - Tổng hợp thành công chỉ số cả 5 domain agents trong 1 tin nhắn duy nhất cho CEO.

---

## 🏁 BÁO CÁO KẾT QUẢ THỰC THI KIỂM THỬ TỰ ĐỘNG

### 1. Kết quả chạy Node Standalone (`node tests/workflows/test_scenarios.spec.js`)

```text
========================================================================
 🦞 RUNNING 20 WORKFLOW TEST CASES FOR DAN-OPENCLAW ORCHESTRATOR
    Testing Multi-Agent, Dan-Manager, Dan-Learning, Dan-Api & Web Tools
========================================================================

--- [Phần 1: Bảo Mật & Tiếp Nhận Sự Kiện] ---
 ✔ [TC-01] Xác thực Webhook HMAC-SHA256 & Tiếp nhận Signed Ecommerce Event
 ✔ [TC-02] Chống trùng lặp sự kiện (Idempotency & Deduplication Engine)

--- [Phần 2: Điều Phối 5 Domain AI Agents] ---
 ✔ [TC-03] Workflow Đần R&D (dan_rnd) - Phân tích xu hướng thị trường & Đề xuất công thức
 ✔ [TC-04] Workflow Đần Logistics (dan_logistics) - Cảnh báo tồn kho & Lập Purchase Order
 ✔ [TC-05] Workflow Đần CFO (dan_cfo) - Đối soát tài chính, phát hiện chênh lệch & Phân loại rủi ro
 ✔ [TC-06] Workflow Đần Ops (dan_ops) - Giám sát đơn hàng thời gian thực & Xử lý sự cố SLA
 ✔ [TC-07] Workflow Đần CSKH (dan_cskh) - Phân tích đánh giá tiêu cực & Đề xuất Voucher

--- [Phần 3: Tương Tác Với Dan-Manager] ---
 ✔ [TC-08] Quy trình xin CEO phê duyệt (Approval Request & Decision Loop)
 ✔ [TC-09] Lệnh dừng khẩn cấp (Emergency Stop) & Khôi phục (Resume) từ Manager
 ✔ [TC-10] Điều chỉnh Cấp độ Tự trị (Autonomy Level & Guardrails Policy)
 ✔ [TC-11] Replay Workflow & Điều tra nguyên nhân gốc không tạo side-effect

--- [Phần 4: Tương Tác Với Dan-Learning] ---
 ✔ [TC-12] Trích xuất bộ nhớ ngắn hạn & Chuyển vào Kho lưu trữ dài hạn (Memory Extractor)
 ✔ [TC-13] Ghi nhận Lịch sử đào tạo AI, Đồng bộ dữ liệu học & Đánh giá năng lực
 ✔ [TC-14] Vòng lặp Tự cải tiến từ phản hồi (Feedback Loop & Prompt Optimization)

--- [Phần 5: Tương Tác Với Dan-Api] ---
 ✔ [TC-15] Điều phối Multi-Provider LLM & Cơ chế dự phòng Failover (Gemini/Claude/GPT)
 ✔ [TC-16] Giám sát Token Metering, Đo lường ngân sách & Giới hạn chi phí (Budget Enforcer)

--- [Phần 6: Năng Lực Web & Tự Động Hóa Thực Thụ] ---
 ✔ [TC-17] Năng lực Web Autonomous: Tìm kiếm thị trường (Search) & Trích xuất nội dung (Fetch)
 ✔ [TC-18] Năng lực Web Autonomous: Thu thập dữ liệu đối thủ đa tầng (Deep Crawl Engine)
 ✔ [TC-19] Năng lực Trình duyệt: Tự động hóa tác vụ headless với Playwright Sandbox

--- [Phần 7: Xử Lý Ngoại Lệ, Giám Sát & Báo Cáo] ---
 ✔ [TC-20] Hộp thư ngoại lệ (Exception Inbox), Dead-Letter Queue & Báo cáo tổng hợp CEO

========================================================================
 📊 BÁO CÁO KẾT QUẢ KIỂM THỬ: DAN-OPENCLAW
========================================================================
 Tổng số kịch bản kiểm thử: 20
 Trạng thái: ✔ THÀNH CÔNG: 20 | ✖ THẤT BẠI: 0
 Thời gian thực thi: 0.01s
========================================================================
```

### 2. Kết quả chạy Jest Toàn Dự Án (`npm test`)

```text
Test Suites: 239 passed, 239 total
Tests:       519 passed, 519 total
Snapshots:   0 total
Time:        3.803 s
Ran all test suites.
```

---

## 🗺️ MA TRẬN TRUY VẾT KIỂM THỬ (TRACEABILITY MATRIX)

| Mã TC | Phân Hệ / Chức Năng | File Mã Nguồn / Service Chính | API Endpoint / Route Liên Quan | Trạng Thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | Webhook Verification | `src/middleware/webhook-verification.middleware.js` | `POST /orchestrator/v1/events` | ✅ PASS |
| **TC-02** | Idempotency Engine | `src/services/workflow/idempotency.service.js` | `POST /orchestrator/v1/events` | ✅ PASS |
| **TC-03** | R&D Agent Workflow | `src/services/ai/agents/rnd.agent.js` | `POST /tools/search`, `POST /tools/fetch` | ✅ PASS |
| **TC-04** | Logistics Stock Alert | `src/services/ai/agents/logistics.agent.js` | `POST /orchestrator/v1/events` | ✅ PASS |
| **TC-05** | CFO Reconciliation | `src/services/ai/agents/cfo.agent.js` | `POST /approvals/:id/decision` | ✅ PASS |
| **TC-06** | Ops SLA Monitor | `src/services/ai/agents/ops.agent.js` | `POST /orchestrator/v1/events` | ✅ PASS |
| **TC-07** | CSKH Sentiment & Voucher | `src/services/ai/agents/cskh.agent.js` | `POST /orchestrator/v1/events` | ✅ PASS |
| **TC-08** | CEO Approval Loop | `src/controllers/approval.controller.js` | `POST /orchestrator/v1/approvals/:id/decision`| ✅ PASS |
| **TC-09** | Emergency Stop & Resume | `src/controllers/operator.controller.js` | `POST /orchestrator/v1/control/emergency-stop` | ✅ PASS |
| **TC-10** | Autonomy Level Policy | `src/services/ai/agents/agent-autonomy.service.js` | `POST /orchestrator/v1/control/level` | ✅ PASS |
| **TC-11** | Workflow Replay Engine | `src/services/operator/replay.service.js` | `POST /orchestrator/v1/control/replay` | ✅ PASS |
| **TC-12** | Memory Extractor & PII | `src/services/ai/memory/memory-extractor.service.js` | `POST /api/learning/memory` | ✅ PASS |
| **TC-13** | AI Training History Store | `src/services/ai/memory/history-store.service.js` | `GET /api/learning/history` | ✅ PASS |
| **TC-14** | Feedback Loop Optimizer | `src/services/ai/research/feedback-loop.service.js` | `POST /orchestrator/v1/feedback` | ✅ PASS |
| **TC-15** | Multi-Provider Failover | `src/services/workflow/action/workflow-fallback.service.js`| `POST /api/chat` (dan-api) | ✅ PASS |
| **TC-16** | Token & Budget Enforcer | `src/services/token.service.js`, `src/services/budget` | `GET /orchestrator/v1/dashboard/metrics` | ✅ PASS |
| **TC-17** | Web Search & Fetch | `src/services/web/search.service.js`, `fetch.service.js` | `POST /tools/search`, `POST /tools/fetch` | ✅ PASS |
| **TC-18** | Deep Crawl Engine | `src/services/web/crawl.service.js` | `POST /tools/crawl` | ✅ PASS |
| **TC-19** | Playwright Automation | `src/services/web/automate.service.js`, `src/services/sandbox`| `POST /tools/automate` | ✅ PASS |
| **TC-20** | DLQ & Daily CEO Report | `src/controllers/ceo.controller.js`, `src/services/reporting` | `POST /orchestrator/v1/commands/daily-report`| ✅ PASS |
