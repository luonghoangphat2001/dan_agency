'use strict';

/**
 * Migration adding high-impact performance composite indexes for Dan API.
 * @param {import('@models/Database')} db
 * @param {{ addIndexIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializePerformanceIndexes(db, helpers) {
  // 1. Tối ưu truy vấn lịch sử hội thoại: WHERE channel_id = ? ORDER BY created_at DESC
  await helpers.addIndexIfMissing('conversations', 'idx_channel_created', ['channel_id', 'created_at']);
  await helpers.addIndexIfMissing('conversations', 'idx_user_created', ['user_id', 'created_at']);

  // 2. Tối ưu nhắc lịch người dùng: WHERE user_id = ? AND platform = ? AND is_active = 1 ORDER BY remind_at ASC
  await helpers.addIndexIfMissing('schedules', 'idx_user_platform_remind', ['user_id', 'platform', 'is_active', 'remind_at']);

  // 3. Tối ưu lọc danh sách câu hỏi học tập và pool đề thi
  await helpers.addIndexIfMissing('learning_item', 'idx_learning_type_active', ['learning_id', 'type', 'is_active']);
  await helpers.addIndexIfMissing('learning_item', 'idx_active_type_level', ['is_active', 'type', 'level']);

  // 4. Tối ưu kiểm tra từ vựng đã gửi: WHERE item_id = ? AND status = 'sent'
  await helpers.addIndexIfMissing('learning_delivery_log', 'idx_item_status', ['item_id', 'status']);

  // 5. Tối ưu hàng đợi thông báo Discord: WHERE status = 'pending' AND attempt_count < 5 ORDER BY created_at ASC
  await helpers.addIndexIfMissing('discord_notification_outbox', 'idx_delivery_status_attempt', ['status', 'attempt_count', 'created_at']);

  // 6. Tối ưu tra cứu tác vụ nền theo user
  await helpers.addIndexIfMissing('agent_tasks', 'idx_user_created', ['user_id', 'created_at']);
  await helpers.addIndexIfMissing('agent_orchestration_runs', 'idx_user_created', ['user_id', 'created_at']);

  // 7. Đồng bộ enum role của bảng users cho các database đã khởi tạo từ trước
  try {
    await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin','user','student') NOT NULL DEFAULT 'user'");
  } catch (_err) {
    // Bỏ qua nếu bảng chưa tồn tại hoặc quyền hạn hạn chế
  }
};
