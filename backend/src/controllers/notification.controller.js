const db = require("../config/db");

/** GET /api/notifications — Lấy danh sách thông báo của user đang đăng nhập */
const getNotifications = (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const sql = `
    SELECT id, type, title, body, link, is_read, created_at
    FROM notification
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `;
  db.query(sql, [userId, limit], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi lấy thông báo", error: err.message });
    const unread = rows.filter(r => !r.is_read).length;
    return res.json({ data: rows, unread_count: unread });
  });
};

/** PATCH /api/notifications/:id/read — Đánh dấu 1 thông báo đã đọc */
const markRead = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const sql = "UPDATE notification SET is_read = 1 WHERE id = ? AND user_id = ?";
  db.query(sql, [id, userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy thông báo." });
    return res.json({ message: "Đã đánh dấu đã đọc." });
  });
};

/** PATCH /api/notifications/read-all — Đánh dấu tất cả đã đọc */
const markAllRead = (req, res) => {
  const userId = req.user.id;
  db.query("UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0", [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ message: "Đã đánh dấu tất cả đã đọc." });
  });
};

module.exports = { getNotifications, markRead, markAllRead };
