import { Router } from 'express';
import { prisma } from '../db/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id }
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/scans', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const scans = await prisma.scan.findMany({
      where: { projectId: req.params.id, project: { userId: req.user!.id } }
    });
    res.json(scans);
  } catch (err) {
    next(err);
  }
});

export { router as projectsRouter };
