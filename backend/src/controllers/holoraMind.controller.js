const db = require('../config/db');

// Mock AI Logic (phản hồi mẫu dựa trên từ khóa bàn đầu)
const getMockAIResponse = (userMessage) => {
  const msg = userMessage.toLowerCase();
  if (msg.includes("xin chào") || msg.includes("hello")) {
    return "Xin chào! Tôi là HoloraMind, trợ lý AI thông minh từ Holora Medical. Tôi có thể giúp gì cho bạn hôm nay?";
  }
  if (msg.includes("triệu chứng") || msg.includes("bệnh")) {
    return "Bạn đang lo lắng về sức khỏe sao? Hãy mô tả chi tiết triệu chứng của bạn để tôi có thể hỗ trợ tư vấn sơ bộ (Lưu ý: Tôi không thay thế hoàn toàn bác sĩ).";
  }
  if (msg.includes("lịch hẹn") || msg.includes("tư vấn")) {
    return "Để đặt lịch hẹn hoặc tư vấn, bạn hãy truy cập vào mục 'Đặt Lịch' trên Navbar của Holora Medical nhé.";
  }
  return "Tôi đã ghi nhận nội dung của bạn. Đây là một thông tin quan trọng. Bạn có muốn đi sâu vào chi tiết nào không? (Tôi đang trong giai đoạn phát triển và sẽ sớm thông minh hơn!)";
};

// 1. Lấy danh sách lịch sử Chat của User
const getChats = (req, res) => {
  const userId = req.user.id;
  const sql = "SELECT * FROM holora_mind_chats WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC";
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 2. Lấy nội dung tin nhắn của một phiên Chat cụ thể
const getChatMessages = (req, res) => {
  const { chatId } = req.params;
  const sql = "SELECT * FROM holora_mind_messages WHERE chat_id = ? ORDER BY created_at ASC";
  db.query(sql, [chatId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 3. Gửi tin nhắn và nhận phản hồi từ AI
const sendMessage = (req, res) => {
  const userId = req.user.id;
  const { chatId, content } = req.body;

  if (!content) return res.status(400).json({ message: "Nội dung tin nhắn trống!" });

  let effectiveChatId = chatId;

  const processChat = (finalChatId) => {
    // 1. Lưu tin nhắn của User
    const userMsgSql = "INSERT INTO holora_mind_messages (chat_id, role, content) VALUES (?, 'user', ?)";
    db.query(userMsgSql, [finalChatId, content], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Cập nhật title chat nếu đây là tin nhắn đầu tiên (title cũ là mặc định)
      const updateTitleSql = `
        UPDATE holora_mind_chats 
        SET title = LEFT(?, 30), updated_at = NOW() 
        WHERE id = ? AND title = 'Cuộc trò chuyện mới'
      `;
      db.query(updateTitleSql, [content, finalChatId]);

      // 2. Lấy Mock AI Response
      const aiContent = getMockAIResponse(content);

      // 3. Lưu tin nhắn của AI
      const aiMsgSql = "INSERT INTO holora_mind_messages (chat_id, role, content) VALUES (?, 'assistant', ?)";
      db.query(aiMsgSql, [finalChatId, aiContent], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        res.json({
          chat_id: finalChatId,
          user_message: content,
          ai_message: aiContent
        });
      });
    });
  };

  if (!effectiveChatId) {
    // Tạo mới phiên chat nếy chưa có chatId
    const newChatSql = "INSERT INTO holora_mind_chats (user_id) VALUES (?)";
    db.query(newChatSql, [userId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      processChat(result.insertId);
    });
  } else {
    processChat(effectiveChatId);
  }
};

module.exports = {
  getChats,
  getChatMessages,
  sendMessage
};
