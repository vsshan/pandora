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

export interface BuildScriptArgs {
  meeting: MeetingInput;
  previousMeetings: PreviousMeetingInput[];
  news: NewsInput[];
  insights: InsightInput[];
  company: CompanyInput;
}

export async function buildScript(args: BuildScriptArgs): Promise<string> {
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
Introduce the upcoming meeting warmly. Cover the meeting title, date, type, who is leading it, and who will be in the room. Then expand meaningfully: explain why this meeting matters strategically given the relationship context, what the key agenda items likely are, what a successful outcome looks like, and any preparation points the banker should keep front of mind. Make the banker feel confident and prepared.

Meeting details:
Title: ${meeting.title}
Date: ${meeting.date}
Type: ${meeting.typeLabel}
Led by: ${meeting.owner}, ${meeting.ownerTitle}
Attendees: ${attendeesList}
Location: ${meeting.location || 'not specified'}
Context: ${meeting.description || 'No additional context provided'}

SECTION 2 — LAST ${previousMeetings.length} CLIENT MEETINGS (approximately 3 minutes / 390 words)
Walk through each previous meeting chronologically. For each one, spend 2 to 3 sentences covering what was discussed, who drove the conversation, what was decided or left unresolved, and any signals from the client. After covering all meetings, synthesize a clear narrative: what patterns are emerging in the relationship, what momentum has been built, what tensions or open questions still need to be addressed, and how today's meeting fits into the arc of the engagement.

Previous meetings:
${previousMeetingLines}

SECTION 3 — MARKET INTELLIGENCE ON ${company.name.toUpperCase()} (approximately 2 minutes / 260 words)
Brief the banker on the latest news and analyst insights. For each news item, state the headline clearly and then explain in one or two sentences why it matters for the banker-client relationship and any strategic implications. For each analyst insight, paraphrase the key finding and connect it to what the banker should watch or probe in today's conversation. Close the briefing with a motivating, natural sign-off — something brief and genuine that sends the banker into the meeting with energy.

Company: ${company.name} | Sector: ${company.sector} | CEO: ${company.ceo}

Latest news:
${newsLines}

Internal analyst insights:
${insightLines}

Begin the briefing now with a natural greeting (Good morning, Good afternoon, or Here is your briefing — pick the one that feels most natural). Do not label the sections — let the transitions speak for themselves.`;

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
