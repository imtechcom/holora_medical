/**
 * Notification Utility
 * Tạo notification trong DB cho bất kỳ user nào.
 *
 * @param {object} db   - mysql2 connection pool
 * @param {object} opts
 *   @param {number}  opts.userId   - ID của user nhận thông báo
 *   @param {string}  opts.type     - Loại: 'ai_result_shared' | 'consultation_reply' | ...
 *   @param {string}  opts.title    - Tiêu đề ngắn
 *   @param {string}  [opts.body]   - Nội dung chi tiết (tuỳ chọn)
 *   @param {string}  [opts.link]   - Đường dẫn frontend (tuỳ chọn)
 */
const createNotification = (db, { userId, type, title, body = null, link = null }) => {
  const sql = `
    INSERT INTO notification (user_id, type, title, body, link, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  db.query(sql, [userId, type, title, body, link], (err) => {
    if (err) console.error("[notification] Insert error:", err.message);
  });
};

module.exports = { createNotification };
