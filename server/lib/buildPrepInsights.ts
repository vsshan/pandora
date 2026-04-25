import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface MeetingInput {
  title: string;
  date: string;
  typeLabel: string;
  owner: string;
  ownerTitle: string;
  attendees?: string[];
  location?: string;
  description?: string;
}

interface PreviousMeetingInput {
  title: string;
  date: string;
  typeLabel: string;
  owner: string;
  description?: string;
}

interface NewsInput {
  id: string;
  headline: string;
  source: string;
  date: string;
  preview?: string;
}

interface InsightInput {
  author: string;
  content: string;
  date: string;
}

interface CompanyInput {
  name: string;
  sector: string;
  ceo: string;
}

export interface BuildPrepInsightsArgs {
  meeting: MeetingInput;
  previousMeetings: PreviousMeetingInput[];
  news: NewsInput[];
  insights: InsightInput[];
  company: CompanyInput;
}

export interface PrepInsightsOutput {
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Urgent';
  news: { id: string; headline: string; source: string }[];
  interactions: { date: string; highlight: string }[];
  icebreakers: string[];
}

export async function buildPrepInsights(args: BuildPrepInsightsArgs): Promise<PrepInsightsOutput> {
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
- summary: 2–3 sentence client pulse summary covering relationship health, key open items, and what is at stake in this meeting. Be specific and actionable.
- sentiment: Classify the overall meeting sentiment as 'Positive' (strong momentum, client engaged), 'Neutral' (status quo, routine), or 'Urgent' (time pressure, risk, or unresolved tension).
- news: Select the 3 most strategically relevant news items from the input. Use the exact id, headline, and source from the input.
- interactions: Summarize the last 3 previous meetings as concise touchpoints. Each highlight should be 1–2 sentences capturing what happened and what was left open.
- icebreakers: 3–4 sharp, specific, actionable strategies or conversation starters for this meeting. These should be tailored to the relationship context — not generic advice.`;

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
            summary: {
              type: 'string',
              description: '2–3 sentence client pulse summary',
            },
            sentiment: {
              type: 'string',
              enum: ['Positive', 'Neutral', 'Urgent'],
              description: 'Overall meeting sentiment classification',
            },
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
              description: 'Top 3 most relevant news items',
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
              description: 'Last 3 meeting touchpoints as concise highlights',
            },
            icebreakers: {
              type: 'array',
              items: { type: 'string' },
              description: '3–4 actionable strategies or conversation starters',
            },
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
