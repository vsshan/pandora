import type { UiSpec } from '../components/ChatRenderer';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  ui_spec?: UiSpec;
  timestamp: Date;
}

export interface ChatSession {
  session_id: string;
  messages: ChatMessage[];
}
