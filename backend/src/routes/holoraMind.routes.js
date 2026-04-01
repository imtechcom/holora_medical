const express = require('express');
const router = express.Router();
const holoraMindController = require('../controllers/holoraMind.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Các route cần Authenticate
router.use(authenticateToken);

router.get('/chats', holoraMindController.getChats);
router.get('/chats/:chatId/messages', holoraMindController.getChatMessages);
router.post('/send', holoraMindController.sendMessage);

module.exports = router;
