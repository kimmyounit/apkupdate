import app from '../server.ts';

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Vercel Serverless Invocation Error',
      message: err?.message || String(err),
      stack: err?.stack || '',
    });
  }
}

