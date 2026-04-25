import { Router } from 'express';
import type { Request, Response } from 'express';
import { buildPrepInsights } from '../lib/buildPrepInsights.js';

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

export default router;
