import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import podcastRouter from './routes/podcast.js';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/podcast', podcastRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Podcast server running on http://localhost:${PORT}`);
});
