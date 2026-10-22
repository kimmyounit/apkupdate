import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import type { User, UserRole } from '../types/index.ts';

const TOKEN_SECRET = 'TAMVESTA-SESSION-KEY-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Simple signed token format: base64(userId:timestamp):signature
export function createSessionToken(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(encodedPayload).digest('hex');
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): string | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(encodedPayload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return null;
    }

    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const [userId, timestampStr] = payload.split(':');
    const timestamp = parseInt(timestampStr, 10);

    // 7-day token expiration
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesi tidak valid. Harap login kembali.' });
  }

  const token = authHeader.substring(7);
  const userId = verifySessionToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Token kadaluarsa atau tidak valid.' });
  }

  const user = db.findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Pengguna tidak ditemukan.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Akun Anda dinonaktifkan. Silakan hubungi Administrator.' });
  }

  req.user = user;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Akses ditolak. Harap login terlebih dahulu.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Akses ditolak. Fitur ini memerlukan hak akses [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
}
