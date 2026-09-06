import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  Minus, 
  RotateCcw, 
  Copy, 
  Check, 
  Loader2, 
  MessageSquare, 
  HelpCircle,
  BookOpen,
  Zap,
  Target,
  ChevronDown
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { apiGeminiSupportChat, apiGetSupportHistory } from '../lib/api';

interface GeminiChatbotProps {
  currentGoalTitle?: string;
  learningTopic?: string;
  currentDay?: number;
  tasksSummary?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

const QUICK_SUPPORT_PROMPTS = [
  'Break down my daily tasks into step-by-step actions',
  'Explain the core concept I need to master today',
  'Give me a 25-minute deep focus study strategy',
  "I'm feeling stuck or overwhelmed—help me restart",
  'Test my understanding with a quick quiz question',
];

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentGoalTitle = 'Personal Mastery & Learning',
  learningTopic,
  currentDay = 1,
  tasksSummary = '',
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleChat = controlledOnToggle || (() => setInternalIsOpen(!internalIsOpen));

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history or set initial welcoming message
  useEffect(() => {
    if (isOpen && !hasLoadedHistory) {
      setHasLoadedHistory(true);
      apiGetSupportHistory('gemini_support_chat')
        .then((res) => {
          if (res.history && res.history.length > 0) {
            setMessages(
              res.history.map((h, i) => ({
                id: `hist_${i}_${Date.now()}`,
                role: h.role,
                content: h.content,
                timestamp: h.timestamp ? new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              }))
            );
          } else {
            // Default initial message from Gemini
            setMessages([
              {
                id: 'welcome_1',
                role: 'model',
                content: `Greetings! I am **Gemini**, your dedicated AI Support Mentor & Learning Ally. 🌌\n\nI am right here with you on your journey for **"${currentGoalTitle}"** (Day ${currentDay}).\n\nWhether you need an explanation of complex topics, step-by-step task guidance, motivation when feeling stuck, or a Pomodoro plan—ask me anything!`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        })
        .catch(() => {
          setMessages([
            {
              id: 'welcome_fallback',
              role: 'model',
              content: `Greetings! I am **Gemini**, your AI Support Guide. How can I support your learning and daily accomplishments right now? ✨`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        });
    }
  }, [isOpen, hasLoadedHistory, currentGoalTitle, currentDay]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = (customMessage || inputValue).trim();
    if (!textToSend || isLoading) return;

    soundFx.playClick();
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await apiGeminiSupportChat({
        message: textToSend,
        conversationId: 'gemini_support_chat',
        currentGoal: currentGoalTitle,
        learningTopic,
        currentDay,
        tasksSummary,
      });

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      soundFx.playClick();
    } catch (err: any) {
      console.error('Gemini Support Chat error:', err);
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: 'I encountered a brief cosmic disturbance while connecting. Please try asking again in a moment!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    soundFx.playClick();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    soundFx.playClick();
    setMessages([
      {
        id: `cleared_${Date.now()}`,
        role: 'model',
        content: `Conversation reset! How can I assist you with **${currentGoalTitle}** today? ✨`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Simple formatting helper for markdown emphasis and bullet points
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Render bullet line
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const clean = line.trim().substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-amber-400 mt-1">•</span>
                <span>{renderInlineStyles(clean)}</span>
              </div>
            );
          }

          // Numbered line
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-amber-400 font-mono text-xs mt-0.5">{numMatch[1]}.</span>
                <span>{renderInlineStyles(numMatch[2])}</span>
              </div>
            );
          }

          return <p key={idx}>{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineStyles = (text: string) => {
    // Basic bold **text** parsing
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Chat Launcher Button (when collapsed) */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            soundFx.playClick();
            toggleChat();
          }}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-bold text-sm shadow-xl shadow-amber-500/25 border border-amber-300/50 cursor-pointer group"
          aria-label="Open Gemini Support"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-black animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-amber-400 animate-ping" />
          </div>
          <span className="font-serif tracking-wide">Gemini Support</span>
        </motion.button>
      )}

      {/* Interactive Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] bg-[#0c0d14] border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden text-[#e0e0e0] backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-bold shadow-md shadow-amber-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-white">Gemini Support</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Online
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50 truncate max-w-[200px]">
                    Day {currentDay} • {currentGoalTitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Clear Chat History"
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    toggleChat();
                  }}
                  title="Minimize"
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Context Badge */}
            <div className="px-4 py-2 bg-amber-500/[0.04] border-b border-amber-500/10 flex items-center justify-between text-xs text-amber-300/80 font-mono">
              <span className="flex items-center gap-1.5 truncate">
                <Target className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">Active Quest: {currentGoalTitle}</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
                Horizon Day {currentDay}
              </span>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                        isUser
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-white/10 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`max-w-[82%] rounded-2xl p-3.5 relative group ${
                        isUser
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-tr-sm'
                          : 'bg-white/[0.04] border border-white/10 text-white/90 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      {renderFormattedContent(msg.content)}

                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-white/5 text-[10px] text-white/40">
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="text-white/40 hover:text-white transition-colors"
                            title="Copy reply"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/10 text-amber-300 border border-amber-400/30 flex items-center justify-center text-xs">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white/70 rounded-tl-sm flex items-center gap-2 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Gemini is synthesizing advice...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Inspiration Prompt Chips */}
            <div className="px-3 py-2 bg-white/[0.02] border-t border-white/5 overflow-x-auto no-scrollbar flex items-center gap-1.5">
              {QUICK_SUPPORT_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/40 border border-white/10 text-white/70 hover:text-amber-200 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white/[0.03] border-t border-white/10 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Gemini for guidance, tips, or explanations..."
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30 transition-all"
              />
              <button
                type="button"
                disabled={isLoading || !inputValue.trim()}
                onClick={() => handleSendMessage()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
