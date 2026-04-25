/// <reference types="@cloudflare/workers-types" />
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

interface Env {
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
}

async function buildScript(
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
    news: Array<{ headline: string; source: string; date: string; preview?: string }>;
    insights: Array<{ author: string; content: string; date: string }>;
    company: { name: string; sector: string; ceo: string };
  }
): Promise<string> {
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
    .map((n) => `- "${n.headline}" (${n.source}, ${n.date})${n.preview ? ' — ' + n.preview : ''}`)
    .join('\n');

  const insightLines = insights
    .map((ins) => `- ${ins.author} (${ins.date}): "${ins.content}"`)
    .join('\n');

  const prompt = `You are writing a spoken audio briefing script for a senior investment banker preparing for a client meeting.

This script will be converted to speech by a text-to-speech engine, so write entirely for the ear:
- Use natural spoken language and conversational transitions
- Do NOT use bullet points, numbered lists, markdown, or any formatting
- Do NOT include stage directions, speaker labels, or section headers
- Vary sentence length to sound natural — mix short punchy sentences with longer ones
- Target length: 800 to 1,100 words (approximately 5 to 8 minutes at a natural speaking pace of 130 words per minute)
- Tone: warm, confident, and professional — like a trusted colleague giving a thorough briefing

Structure the briefing as one continuous, flowing narrative with three clear sections:

SECTION 1 — TODAY'S MEETING (approximately 2 minutes / 260 words)
Introduce the upcoming meeting warmly. Cover the meeting title, date, type, who is leading it, and who will be in the room. Then expand meaningfully: explain why this meeting matters strategically given the relationship context, what the key agenda items likely are, what a successful outcome looks like, and any preparation points the banker should keep front of mind.

Meeting details:
Title: ${meeting.title}
Date: ${meeting.date}
Type: ${meeting.typeLabel}
Led by: ${meeting.owner}, ${meeting.ownerTitle}
Attendees: ${attendeesList}
Location: ${meeting.location || 'not specified'}
Context: ${meeting.description || 'No additional context provided'}

SECTION 2 — LAST ${previousMeetings.length} CLIENT MEETINGS (approximately 3 minutes / 390 words)
Walk through each previous meeting chronologically. For each one, spend 2 to 3 sentences covering what was discussed, who drove the conversation, what was decided or left unresolved. After covering all meetings, synthesize a clear narrative: what patterns are emerging, what momentum has been built, what tensions or open questions remain.

Previous meetings:
${previousMeetingLines}

SECTION 3 — MARKET INTELLIGENCE ON ${company.name.toUpperCase()} (approximately 2 minutes / 260 words)
Brief the banker on the latest news and analyst insights. For each news item, explain why it matters for the relationship. For each analyst insight, connect it to what the banker should watch or probe. Close with a brief, genuine sign-off.

Company: ${company.name} | Sector: ${company.sector} | CEO: ${company.ceo}

Latest news:
${newsLines}

Internal analyst insights:
${insightLines}

Begin the briefing now with a natural greeting. Do not label the sections.`;

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }
  return textBlock.text;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { ANTHROPIC_API_KEY, OPENAI_API_KEY } = context.env;

  if (!ANTHROPIC_API_KEY || !OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing API keys' }), {
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
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const script = await buildScript(anthropic, {
      meeting: meeting as Parameters<typeof buildScript>[1]['meeting'],
      previousMeetings: (previousMeetings ?? []) as Parameters<typeof buildScript>[1]['previousMeetings'],
      news: (news ?? []) as Parameters<typeof buildScript>[1]['news'],
      insights: (insights ?? []) as Parameters<typeof buildScript>[1]['insights'],
      company: company as Parameters<typeof buildScript>[1]['company'],
    });

    const ttsResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: script,
      response_format: 'mp3',
    });

    return new Response(ttsResponse.body, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (err) {
    console.error('Podcast generation error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate podcast' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
