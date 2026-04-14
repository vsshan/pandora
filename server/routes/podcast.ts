import { Router } from 'express';
import type { Request, Response } from 'express';
import { buildScript } from '../lib/buildScript.js';
import { synthesizeSpeech } from '../lib/synthesizeSpeech.js';

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
      news: Array<{ headline: string; source: string; date: string; preview?: string }>;
      insights: Array<{ author: string; content: string; date: string }>;
      company: { name: string; sector: string; ceo: string };
    };

    if (!meeting || !company) {
      res.status(400).json({ error: 'Missing required fields: meeting, company' });
      return;
    }

    // Step 1: generate podcast script via Claude
    const script = await buildScript({ meeting, previousMeetings, news, insights, company });

    // Step 2: synthesize audio via OpenAI TTS
    const audioStream = await synthesizeSpeech(script);

    // Step 3: stream MP3 directly to client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    audioStream.pipe(res);

    audioStream.on('error', (err: Error) => {
      console.error('Audio stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Audio stream failed' });
      }
    });
  } catch (err) {
    console.error('Podcast generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate podcast' });
    }
  }
});

export default router;
