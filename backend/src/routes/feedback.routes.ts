
import { Router } from 'express';
import {
    submitFeedback,
    getFeedback,
    updateFeedbackStatus
} from '../controllers/feedback.controller';
import { protect, adminProtect } from '../middleware/auth.middleware';

const router = Router();

// User can submit feedback
router.post('/', protect, submitFeedback);

// Admin can get all feedback and update status
router.get('/', protect, adminProtect, getFeedback);
router.put('/:feedbackId', protect, adminProtect, updateFeedbackStatus);

export default router;