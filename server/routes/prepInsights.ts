import { Router } from 'express';
import type { Request, Response } from 'express';
import { buildPrepInsights } from '../lib/buildPrepInsights.js';
import { buildInsightsNarration } from '../lib/buildInsightsNarration.js';
import { synthesizeSpeech } from '../lib/synthesizeSpeech.js';
import type { PrepInsightsOutput } from '../lib/buildPrepInsights.js';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { meeting, previousMeetings, news, insights, company } = req.body as {
      meeting: {
        title: string;
        date: string;
        typeLabel: string;
        owner: string;
        ownerTitle: string;
        attendees?: string[];
        location?: string;
        description?: string;
      };
      previousMeetings: Array<{
        title: string;
        date: string;
        typeLabel: string;
        owner: string;
        description?: string;
      }>;
      news: Array<{ id: string; headline: string; source: string; date: string; preview?: string }>;
      insights: Array<{ author: string; content: string; date: string }>;
      company: { name: string; sector: string; ceo: string };
    };

    if (!meeting || !company) {
      res.status(400).json({ error: 'Missing required fields: meeting, company' });
      return;
    }

    const data = await buildPrepInsights({
      meeting,
      previousMeetings: previousMeetings ?? [],
      news: news ?? [],
      insights: insights ?? [],
      company,
    });

    res.json(data);
  } catch (err) {
    console.error('Prep insights generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate prep insights' });
    }
  }
});

router.post('/listen', async (req: Request, res: Response) => {
  try {
    const data = req.body as PrepInsightsOutput;

    if (!data?.summary) {
      res.status(400).json({ error: 'Missing insights data' });
      return;
    }

    const script = buildInsightsNarration(data);
    const TTS_LIMIT = 4096;
    const truncated =
      script.length <= TTS_LIMIT
        ? script
        : script.slice(0, TTS_LIMIT).replace(/[^.!?]*$/, '').trimEnd();

    const audioStream = await synthesizeSpeech(truncated);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    audioStream.pipe(res);

    audioStream.on('error', (err: Error) => {
      console.error('Insights audio stream error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Audio stream failed' });
    });
  } catch (err) {
    console.error('Prep insights listen error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate insights audio' });
  }
});

export default router;
