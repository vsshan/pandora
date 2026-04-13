import OpenAI from 'openai';
import { Readable } from 'node:stream';

const openai = new OpenAI();

export async function synthesizeSpeech(text: string): Promise<Readable> {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',        // warm, professional, mid-paced — ideal for briefings
    input: text,
    response_format: 'mp3',
    speed: 1.0,
  });

  // OpenAI SDK returns a Web Streams ReadableStream; convert to Node.js Readable
  return Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
}
