import app from '../server.ts';
import type { Request, Response } from 'express';

/**
 * Vercel Serverless Function handler untuk semua /api/* requests
 * 
 * Di Vercel serverless, req.body mungkin belum di-parse karena body
 * bisa berupa stream yang perlu dikumpulkan dulu.
 * Handler ini mengumpulkan body stream, parse sebagai JSON,
 * lalu attach ke req.body sebelum diteruskan ke Express app.
 */
export default async function handler(req: any, res: any) {
  // Jika body belum di-parse (req.body kosong/undefined) tapi ada content
  if (
    req.method !== 'GET' &&
    req.method !== 'HEAD' &&
    req.method !== 'OPTIONS' &&
    (req.body === undefined || req.body === null || (typeof req.body === 'string' && req.body === ''))
  ) {
    try {
      const rawBody = await new Promise<string>((resolve, reject) => {
        let data = '';
        req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      if (rawBody && rawBody.length > 0) {
        const ct = (req.headers['content-type'] || '').toLowerCase();
        if (ct.includes('application/json')) {
          try { req.body = JSON.parse(rawBody); } catch { req.body = {}; }
        } else if (ct.includes('urlencoded')) {
          req.body = Object.fromEntries(new URLSearchParams(rawBody).entries());
        } else {
          req.body = rawBody;
        }
      } else {
        req.body = {};
      }
    } catch (_) {
      req.body = {};
    }
  }

  try {
    return app(req as Request, res as Response);
  } catch (err: any) {
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Vercel Serverless Error',
        message: err?.message || String(err),
      });
    }
  }
}
