import React, { useState, useRef, useEffect } from 'react';
import { useQueryAssistant } from '@workspace/api-client-react';
import { useLocationContext } from '@/contexts/LocationContext';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '@/assets/logo.png';

const SUGGESTIONS = [
  "Should I carry an umbrella today?",
  "Is today good for outdoor exercise?",
  "What should I wear today?",
  "Safe for trekking today?",
  "Can I play cricket today?",
];

type Message = {
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
};

export default function Assistant() {
  const { location } = useLocationContext();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello! I'm AERISYN. How can I help you plan your day in ${location.name}?` }
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useQueryAssistant();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');

    mutation.mutate({
      data: { question: text, lat: location.lat, lon: location.lon, city_name: location.name }
    }, {
      onSuccess: (res) => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.answer,
          metadata: { confidence: res.confidence, recommendations: res.recommendations }
        }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble analyzing the weather data right now." }]);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100dvh - 120px)', minHeight: '400px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-white/10 shrink-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10 shrink-0">
          <img src={logoImg} alt="AERISYN" className="w-6 h-6 sm:w-8 sm:h-8 object-contain drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">AI Weather Assistant</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">Context-aware meteorological analysis for {location.name}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 sm:space-y-6 scrollbar-hide pb-2" role="log" aria-live="polite" aria-label="Conversation">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30'}`}
                aria-hidden="true"
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <img src={logoImg} alt="" className="w-5 h-5 object-contain" />}
              </div>
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card/60 backdrop-blur-md border border-white/5 rounded-tl-sm'}`}
                role={msg.role === 'assistant' ? 'article' : undefined}
              >
                <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>

                {msg.metadata?.recommendations && (
                  <div className="mt-3 sm:mt-4 space-y-2">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Recommendations</div>
                    <ul className="space-y-1">
                      {msg.metadata.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm bg-black/20 p-2 rounded-lg border border-white/5">
                          <span className="text-primary mt-0.5 shrink-0" aria-hidden="true">•</span> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {msg.metadata?.confidence && (
                  <div className="mt-3 text-[10px] uppercase font-mono text-muted-foreground/50 text-right">
                    Confidence: {msg.metadata.confidence}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {mutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3" aria-label="Assistant is typing">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0" aria-hidden="true">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 pt-3 sm:pt-4">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSubmit(s)}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground min-h-[32px]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }}
          className="relative flex items-center"
          aria-label="Send a message"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the weather..."
            disabled={mutation.isPending}
            className="w-full bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl py-3.5 sm:py-4 pl-5 sm:pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 text-sm sm:text-base min-h-[52px]"
            aria-label="Message input"
          />
          <button
            type="submit"
            disabled={!input.trim() || mutation.isPending}
            className="absolute right-2 p-2.5 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Send message"
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
