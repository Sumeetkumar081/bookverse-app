
import { Router } from 'express';
import { getKpis } from '../controllers/kpi.controller';
import { protect, adminProtect } from '../middleware/auth.middleware';

const router = Router();

// This route is protected and only accessible by admins
router.get('/', protect, adminProtect, getKpis);

export default router;
