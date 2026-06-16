import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types/chat';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = { role: 'user', content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, session_id: sessionId }),
      });

      const data: { response?: string; ui_spec?: unknown; session_id?: string; error?: string } = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response ?? '',
        ui_spec: data.ui_spec as ChatMessage['ui_spec'],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I couldn't reach the CRM agent. ${err instanceof Error ? err.message : 'Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
