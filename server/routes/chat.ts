import { Router } from 'express';

const router = Router();

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL ?? 'http://localhost:8000';

router.post('/message', async (req, res) => {
  const { message, session_id } = req.body as { message?: string; session_id?: string };

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  try {
    const upstream = await fetch(`${AGENT_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.trim(), session_id: session_id ?? null }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(502).json({ error: `Agent service error: ${upstream.status}`, detail: text });
      return;
    }

    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ error: 'Agent service unavailable', detail: message });
  }
});

export default router;
