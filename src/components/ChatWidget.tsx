import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import Icon from './Icon';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../types/chat';

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-card-light dark:bg-card-dark rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-secondary dark:bg-text-dark-secondary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  'Show me tier-A contacts in Technology',
  'What deals are in Negotiation stage?',
  'Find active campaigns',
  'List upcoming roadshow events',
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                <Icon name="smart_toy" className="text-sm text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">CRM Assistant</p>
                <p className="text-xs text-blue-200 leading-tight">Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                  title="Clear conversation"
                >
                  <Icon name="restart_alt" className="text-lg" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center gap-4 pb-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-2">
                    <Icon name="hub" className="text-2xl text-primary dark:text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                    Ask about your CRM
                  </p>
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                    Contacts, deals, campaigns, events & more
                  </p>
                </div>
                <div className="w-full space-y-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="w-full text-left text-xs px-3 py-2 rounded-xl border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-card-light dark:hover:bg-card-dark hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 px-3 py-3 border-t border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark">
            <div className="flex items-center gap-2 rounded-xl bg-background-light dark:bg-background-dark px-3 py-2 border border-border-light dark:border-border-dark focus-within:border-accent transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about contacts, deals…"
                className="flex-1 bg-transparent text-sm text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-7 h-7 rounded-full bg-accent flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shrink-0"
              >
                <Icon name="send" className="text-sm text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
        aria-label={isOpen ? 'Close CRM chat' : 'Open CRM chat'}
      >
        {isOpen ? (
          <Icon name="close" className="text-2xl text-white" />
        ) : (
          <>
            <Icon name="chat" className="text-2xl text-white" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                {messages.filter((m) => m.role === 'assistant').length}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
