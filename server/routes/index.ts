import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import goalRoutes from './goals';
import objectiveRoutes from './objectives';
import taskRoutes from './tasks';
import aiRoutes from './ai';
import voiceRoutes from './voice';
import nlCommandRoutes from './nl-commands';
import ambientAiRoutes from './ambient-ai';
import suggestionsRoutes from './suggestions';
import personalizationRoutes from './personalization';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/goals', goalRoutes);
router.use('/objectives', objectiveRoutes);
router.use('/tasks', taskRoutes);
router.use('/ai', aiRoutes);
router.use('/voice', voiceRoutes);
router.use('/nl', nlCommandRoutes);
router.use('/ambient-ai', ambientAiRoutes);
router.use('/suggestions', suggestionsRoutes);
router.use('/personalization', personalizationRoutes);

export default router;
