
import { Router } from 'express';
import {
    initiateChat,
    getChatSessions,
    getChatMessages,
} from '../controllers/chat.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protect all chat routes
router.use(protect);

router.post('/initiate', initiateChat);
router.get('/sessions', getChatSessions);
router.get('/sessions/:sessionId/messages', getChatMessages);

export default router;
