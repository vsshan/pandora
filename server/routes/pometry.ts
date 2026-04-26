import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();
const POMETRY_BASE = process.env.POMETRY_URL ?? 'http://localhost:8000';

async function proxyGet(req: Request, res: Response, path: string) {
  try {
    const qs = new URLSearchParams(req.query as Record<string, string>).toString();
    const url = `${POMETRY_BASE}${path}${qs ? '?' + qs : ''}`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch {
    res.status(502).json({ error: 'Pometry service unavailable' });
  }
}

router.get('/health',             (req, res) => proxyGet(req, res, '/health'));
router.get('/network-overview',   (req, res) => proxyGet(req, res, '/network-overview'));
router.get('/contacts',           (req, res) => proxyGet(req, res, '/contacts'));
router.get('/contacts/:id',       (req, res) => proxyGet(req, res, `/contacts/${req.params.id}`));
router.get('/timeline',           (req, res) => proxyGet(req, res, '/timeline'));
router.get('/trends',             (req, res) => proxyGet(req, res, '/trends'));

export default router;
