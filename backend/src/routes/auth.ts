import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/client';
import { env } from '../config/env';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = RegisterSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw createError('Email already taken', 409);
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword }
    });
    
    const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
    const authPayload = { token, user: { id: user.id, email: user.email } };
    res.json({ success: true, ...authPayload, data: authPayload });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = RegisterSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw createError('Invalid credentials', 401);
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw createError('Invalid credentials', 401);
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
    const authPayload = { token, user: { id: user.id, email: user.email } };
    res.json({ success: true, ...authPayload, data: authPayload });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, createdAt: true },
    });
    if (!user) throw createError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export { router as authRouter };
