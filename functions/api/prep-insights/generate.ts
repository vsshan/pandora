/// <reference types="@cloudflare/workers-types" />
import Anthropic from '@anthropic-ai/sdk';

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface PrepInsightsOutput {
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Urgent';
  news: { id: string; headline: string; source: string }[];
  interactions: { date: string; highlight: string }[];
  icebreakers: string[];
}

async function buildPrepInsights(
  client: Anthropic,
  args: {
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
  }
): Promise<PrepInsightsOutput> {
  const { meeting, previousMeetings, news, insights, company } = args;

  const attendeesList =
    meeting.attendees && meeting.attendees.length > 0
      ? meeting.attendees.join(', ')
      : 'not specified';

  const previousMeetingLines = previousMeetings
    .map(
      (m, i) =>
        `${i + 1}. "${m.title}" on ${m.date} (${m.typeLabel}, led by ${m.owner})${m.description ? ' — ' + m.description : ''}`
    )
    .join('\n');

  const newsLines = news
    .map(
      (n) =>
        `[id:${n.id}] "${n.headline}" — ${n.source} (${n.date})${n.preview ? ': ' + n.preview : ''}`
    )
    .join('\n');

  const insightLines = insights
    .map((ins) => `- ${ins.author} (${ins.date}): "${ins.content}"`)
    .join('\n');

  const prompt = `You are a senior investment banking analyst preparing a concise pre-meeting intelligence brief for a banker.

Analyze the following context and produce a structured brief:

UPCOMING MEETING:
Title: ${meeting.title}
Date: ${meeting.date}
Type: ${meeting.typeLabel}
Led by: ${meeting.owner}, ${meeting.ownerTitle}
Attendees: ${attendeesList}
Location: ${meeting.location || 'not specified'}
Context: ${meeting.description || 'No additional context'}

CLIENT: ${company.name} | Sector: ${company.sector} | CEO: ${company.ceo}

PREVIOUS MEETINGS (most recent first):
${previousMeetingLines}

RECENT NEWS:
${newsLines}

ANALYST INSIGHTS:
${insightLines}

Instructions:
- summary: 2–3 sentence client pulse summary covering relationship health, key open items, and what is at stake. Be specific and actionable.
- sentiment: Classify as 'Positive' (strong momentum), 'Neutral' (status quo), or 'Urgent' (time pressure or unresolved tension).
- news: Select the 3 most strategically relevant news items. Use the exact id, headline, and source from the input.
- interactions: Summarize the last 3 previous meetings as concise touchpoints (1–2 sentences each).
- icebreakers: 3–4 sharp, specific, actionable strategies or conversation starters tailored to this relationship.`;

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    tools: [
      {
        name: 'format_prep_insights',
        description: 'Format meeting prep insights as a structured brief for the banker',
        input_schema: {
          type: 'object' as const,
          properties: {
            summary: { type: 'string' },
            sentiment: { type: 'string', enum: ['Positive', 'Neutral', 'Urgent'] },
            news: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  headline: { type: 'string' },
                  source: { type: 'string' },
                },
                required: ['id', 'headline', 'source'],
              },
            },
            interactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  highlight: { type: 'string' },
                },
                required: ['date', 'highlight'],
              },
            },
            icebreakers: { type: 'array', items: { type: 'string' } },
          },
          required: ['summary', 'sentiment', 'news', 'interactions', 'icebreakers'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'format_prep_insights' },
    messages: [{ role: 'user', content: prompt }],
  });

  const toolBlock = message.content.find((b) => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('No tool_use block in Claude response');
  }

  return toolBlock.input as PrepInsightsOutput;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { ANTHROPIC_API_KEY } = context.env;

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await context.request.json<{
      meeting: unknown;
      previousMeetings: unknown[];
      news: unknown[];
      insights: unknown[];
      company: unknown;
    }>();
    const { meeting, previousMeetings, news, insights, company } = body;

    if (!meeting || !company) {
      return new Response(JSON.stringify({ error: 'Missing required fields: meeting, company' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const data = await buildPrepInsights(anthropic, {
      meeting: meeting as Parameters<typeof buildPrepInsights>[1]['meeting'],
      previousMeetings: (previousMeetings ?? []) as Parameters<typeof buildPrepInsights>[1]['previousMeetings'],
      news: (news ?? []) as Parameters<typeof buildPrepInsights>[1]['news'],
      insights: (insights ?? []) as Parameters<typeof buildPrepInsights>[1]['insights'],
      company: company as Parameters<typeof buildPrepInsights>[1]['company'],
    });

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Prep insights generation error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate prep insights' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
