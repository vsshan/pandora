import type { PrepInsightsOutput } from './buildPrepInsights.js';

export function buildInsightsNarration(data: PrepInsightsOutput): string {
  const parts: string[] = [];

  parts.push(`Client Pulse. ${data.summary}`);

  if (data.icebreakers.length > 0) {
    parts.push(
      `Suggested strategies. ${data.icebreakers.map((tip, i) => `${i + 1}. ${tip}`).join(' ')}`
    );
  }

  if (data.news.length > 0) {
    const headlines = data.news.map((n) => `${n.headline}, from ${n.source}`).join('. ');
    parts.push(`Market context. ${headlines}.`);
  }

  if (data.interactions.length > 0) {
    const touchpoints = data.interactions.map((t) => `${t.date}: ${t.highlight}`).join('. ');
    parts.push(`Recent touchpoints. ${touchpoints}.`);
  }

  return parts.join(' ');
}
