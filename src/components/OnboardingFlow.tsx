import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Compass, 
  Clock, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  Leaf, 
  Sun,
  Loader2,
  HelpCircle,
  Wand2
} from 'lucide-react';
import { CreatureType, UserGoal } from '../types';
import { CREATURE_ARCHETYPES } from '../utils/creatureData';
import { CreatureAvatar } from './CreatureAvatar';
import { soundFx } from '../utils/audio';

import { apiGoalPlanner } from '../lib/api';

interface OnboardingFlowProps {
  userEmail: string;
  onCompleteOnboarding: (
    goal: { title: string; description: string; targetDays: number; dailyMinutes: number },
    creatureType: CreatureType,
    creatureName: string,
    roadmapData: any
  ) => Promise<void> | void;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  userEmail,
  onCompleteOnboarding,
}) => {
  // Steps: 'dialogue' -> 'egg_selection' -> 'naming_and_synthesis'
  const [step, setStep] = useState<'dialogue' | 'egg_selection' | 'naming_and_synthesis'>('dialogue');

  // Dialogue State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Goal Form Fields
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [targetDays, setTargetDays] = useState<number>(14);
  const [dailyMinutes, setDailyMinutes] = useState<number>(30);

  // Egg Selection State
  const [selectedCreatureType, setSelectedCreatureType] = useState<CreatureType>('golden_celestial_wolf');
  const [creatureName, setCreatureName] = useState('');

  // Synthesis State
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisStepText, setSynthesisStepText] = useState('Consulting the Astral Oracle...');
  const [errorMessage, setErrorMessage] = useState('');

  // Quick Inspirations
  const quickGoalPresets = [
    { title: 'Learn Full-Stack Web Development', days: 30, mins: 45, desc: 'Master React, TypeScript, APIs, and modern container deployments' },
    { title: 'Master Generative AI & Prompt Craft', days: 14, mins: 30, desc: 'Deep dive into LLM architectures, agents, and real-world tools' },
    { title: 'Learn Python for Data Science', days: 21, mins: 40, desc: 'Data analysis, pandas, algorithms, and visualization' },
    { title: 'Accomplish Writing My Project Manuscript', days: 21, mins: 35, desc: 'Draft chapters, structured outline, and deep creative flow' },
    { title: 'Establish 45-Min Daily Deep Focus Routine', days: 14, mins: 25, desc: 'Mindfulness, deliberate practice, time-blocking, and reflection' },
  ];

  // Initial greeting from Gemini
  useEffect(() => {
    const greetingText = `Greetings, seeker ${userEmail.split('@')[0]}! 🌌 I am Gemini, your Astral Guide and Learning Companion.\n\nTo begin your journey in the sanctuary, tell me: **What do you want to learn or accomplish today?**\n\n*(Share any skill, project, or milestone you want to conquer—I will architect a tailored step-by-step roadmap and daily focus tasks for you!)*`;
    
    setMessages([
      {
        id: 'msg_init',
        role: 'assistant',
        content: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [userEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isAiTyping) return;

    soundFx.playClick();
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsAiTyping(true);

    // Auto-detect or extract title if not set
    if (!goalTitle) {
      setGoalTitle(textToSend.slice(0, 60));
    }
    if (!goalDescription) {
      setGoalDescription(textToSend);
    }

    try {
      const res = await fetch('/api/ai/onboarding-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          userEmail,
        }),
      });

      if (!res.ok) throw new Error('Failed to reach Gemini');
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'Your resolve shines brightly. Let us configure your path.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newHistory, aiMsg]);
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `msg_fallback_${Date.now()}`,
        role: 'assistant',
        content: `I hear your ambition clearly: "${textToSend}". Let us forge this vision into reality! Whenever you are ready, choose your mythical egg companion below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newHistory, fallbackMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handlePresetSelect = (preset: typeof quickGoalPresets[0]) => {
    soundFx.playClick();
    setGoalTitle(preset.title);
    setGoalDescription(preset.desc);
    setTargetDays(preset.days);
    setDailyMinutes(preset.mins);
    handleSendMessage(`I want to achieve: "${preset.title}". I'm aiming for a ${preset.days}-day roadmap with ${preset.mins} minutes per day. Context: ${preset.desc}`);
  };

  const handleProceedToEggSelection = () => {
    soundFx.playClick();
    if (!goalTitle.trim()) {
      setGoalTitle('Personal Growth & Skill Mastery');
    }
    setStep('egg_selection');
  };

  const handleSelectEgg = (type: CreatureType) => {
    soundFx.playClick();
    setSelectedCreatureType(type);
    const defaultNames: Record<CreatureType, string> = {
      green_alien_cosmos: 'Sprout',
      phoenix_dragon_lava: 'Ignis',
      golden_celestial_wolf: 'Solaris',
    };
    if (!creatureName) {
      setCreatureName(defaultNames[type]);
    }
  };

  const handleProceedToNaming = () => {
    soundFx.playClick();
    const defaultNames: Record<CreatureType, string> = {
      green_alien_cosmos: 'Sprout',
      phoenix_dragon_lava: 'Ignis',
      golden_celestial_wolf: 'Solaris',
    };
    if (!creatureName.trim()) {
      setCreatureName(defaultNames[selectedCreatureType]);
    }
    setStep('naming_and_synthesis');
  };

  // Fallback structured roadmap builder in case of timeout or API disruption
  const createFallbackRoadmap = () => {
    const activeGoal = goalTitle || 'Personal Mastery Goal';
    const daysCount = Math.max(7, Math.min(60, targetDays || 14));
    const mins = Math.max(15, Math.min(180, dailyMinutes || 30));

    const fallbackDays = Array.from({ length: daysCount }).map((_, idx) => ({
      dayNumber: idx + 1,
      phaseNumber: Math.floor(idx / 7) + 1,
      title: `Day ${idx + 1}: Foundational Action`,
      theme: `Step ${idx + 1} Progression`,
      tasks: [
        {
          id: `task_${idx + 1}_1`,
          title: `Read & prepare focus materials for ${activeGoal} (Day ${idx + 1})`,
          estimatedMinutes: Math.round(mins * 0.4),
          priority: 'high' as const,
        },
        {
          id: `task_${idx + 1}_2`,
          title: `Execute focused ${mins}m practical session`,
          estimatedMinutes: Math.round(mins * 0.6),
          priority: 'medium' as const,
        },
      ],
      dailyTip: 'Focus on small daily consistency over giant occasional bursts.',
      isMilestone: (idx + 1) % 7 === 0 || idx + 1 === daysCount,
      milestoneTitle: `Milestone Checkpoint ${Math.floor((idx + 1) / 7) + 1}`,
    }));

    return {
      roadmapTitle: `${activeGoal} Master Roadmap`,
      summary: `A structured ${daysCount}-day progression designed for ${mins} minutes of daily focus.`,
      estimatedDifficulty: 'Intermediate',
      phases: [
        { phaseNumber: 1, title: 'Phase 1: Foundation & Priming', description: 'Establish foundational habits and core basics.', dayRange: 'Days 1-7' },
        { phaseNumber: 2, title: 'Phase 2: Deep Momentum', description: 'Expand practice, overcome friction, and build practical output.', dayRange: 'Days 8-14' },
      ],
      days: fallbackDays,
      generatedAt: new Date().toISOString(),
    };
  };

  // Final generation of day-by-day roadmap and companion hatching
  const handleGenerateAndHatch = async () => {
    soundFx.playClick();
    setIsSynthesizing(true);
    setErrorMessage('');

    const phases = [
      'Invoking Gemini 3.8 Flash Productivity Architect...',
      'Structuring Day-by-Day Micro-Quests & Milestones...',
      'Infusing Egg with Elemental Stardust...',
      'Finalizing Astral Companion Sanctuary...',
    ];

    let phaseIndex = 0;
    const interval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      setSynthesisStepText(phases[phaseIndex]);
    }, 1200);

    try {
      // Race API call with an 8.5 second timeout so user is never frozen
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI roadmap generation timeout')), 8500)
      );

      const apiPromise = apiGoalPlanner({
        goalTitle: goalTitle || 'Personal Mastery Goal',
        goalDescription: goalDescription || 'Consistent day by day improvement',
        targetDays: targetDays || 14,
        dailyMinutes: dailyMinutes || 30,
      });

      let roadmapData: any;
      try {
        roadmapData = await Promise.race([apiPromise, timeoutPromise]);
      } catch (raceErr) {
        console.warn('AI request timed out or degraded; seamlessly generating structured roadmap:', raceErr);
        roadmapData = createFallbackRoadmap();
      }

      clearInterval(interval);
      soundFx.playLevelUp();

      // Complete onboarding and await the app transition
      await onCompleteOnboarding(
        {
          title: goalTitle || 'Personal Mastery',
          description: goalDescription || 'Steady daily progress',
          targetDays: targetDays || 14,
          dailyMinutes: dailyMinutes || 30,
        },
        selectedCreatureType,
        creatureName || 'Astral Companion',
        roadmapData || createFallbackRoadmap()
      );
    } catch (err: any) {
      clearInterval(interval);
      console.error('Synthesis error:', err);
      const fallback = createFallbackRoadmap();

      try {
        soundFx.playLevelUp();
        await onCompleteOnboarding(
          {
            title: goalTitle || 'Personal Mastery',
            description: goalDescription || 'Steady daily progress',
            targetDays: targetDays || 14,
            dailyMinutes: dailyMinutes || 30,
          },
          selectedCreatureType,
          creatureName || 'Astral Companion',
          fallback
        );
      } catch (subErr: any) {
        console.error('Secondary onboarding error:', subErr);
        setErrorMessage('Network synchronization had a momentary delay. Click "Instant Enter Sanctuary" below.');
      }
    } finally {
      clearInterval(interval);
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#e0e0e0] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background celestial particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-4xl z-10">
        {/* Step Indicator Header */}
        <div className="mb-6 flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-3xl px-6 sm:px-8 py-5 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              ✨
            </div>
            <div>
              <h2 className="text-sm font-serif italic text-white tracking-wide">
                Sanctuary Onboarding
              </h2>
              <p className="text-xs text-white/40 font-mono">
                {step === 'dialogue' && 'Step 1: Goal Discovery with Gemini'}
                {step === 'egg_selection' && 'Step 2: Choose Your Mythical Egg Nature'}
                {step === 'naming_and_synthesis' && 'Step 3: Bond & Generate Day-by-Day Roadmap'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${step === 'dialogue' ? 'bg-amber-400 ring-4 ring-amber-400/20' : 'bg-amber-500'}`} />
            <span className={`w-2 h-2 rounded-full ${step === 'egg_selection' ? 'bg-amber-400 ring-4 ring-amber-400/20' : step === 'naming_and_synthesis' ? 'bg-amber-500' : 'bg-white/10'}`} />
            <span className={`w-2 h-2 rounded-full ${step === 'naming_and_synthesis' ? 'bg-amber-400 ring-4 ring-amber-400/20' : 'bg-white/10'}`} />
          </div>
        </div>

        {/* STEP 1: GOAL DISCOVERY CHAT */}
        {step === 'dialogue' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left 2 Cols: Interactive Gemini Conversation */}
            <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col h-[560px] backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-400" />
                  <span className="font-serif italic text-sm text-white">Gemini Astral Guide</span>
                </div>
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/5 text-amber-400 border border-white/10">
                  Ready
                </span>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-white text-black font-bold'
                          : 'bg-white/5 border border-white/10 text-amber-400'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl max-w-[82%] text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-white/10 border border-white/15 text-white rounded-tr-none'
                          : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none shadow-md'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <span className="block text-[10px] text-white/40 font-mono mt-1 text-right">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex items-center gap-2 text-xs text-white/50 p-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Gemini is analyzing your ambition...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="pt-3 border-t border-white/5 flex gap-2">
                <input
                  id="onboarding-chat-input"
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="e.g., I want to master full-stack React and Node in 30 days..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                />
                <button
                  id="send-goal-chat-btn"
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isAiTyping || !inputMessage.trim()}
                  className="px-5 py-3 bg-white hover:bg-amber-400 disabled:opacity-40 text-black font-bold rounded-2xl text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right 1 Col: Quick Goal Presets & Parameters Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-md shadow-2xl">
              <div>
                <h3 className="text-base font-serif italic text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Goal Parameters
                </h3>
                <p className="text-xs text-white/40 mb-4">
                  Define your parameters or pick an instant goal preset:
                </p>

                {/* Quick Presets */}
                <div className="space-y-2 mb-4">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 block">
                    Quick Inspirations:
                  </label>
                  {quickGoalPresets.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="w-full text-left p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-xs text-white/90 cursor-pointer group"
                    >
                      <div className="font-medium group-hover:text-amber-300 transition-colors flex items-center justify-between">
                        <span className="truncate pr-2">{preset.title}</span>
                        <span className="text-[10px] text-white/40 font-mono shrink-0">{preset.days}d · {preset.mins}m</span>
                      </div>
                      <div className="text-[11px] text-white/40 truncate mt-0.5">{preset.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Timeline & Commitment Sliders */}
                <div className="space-y-4 pt-3 border-t border-white/5">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                      <span className="text-white/70 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> Timeline
                      </span>
                      <span className="font-mono text-amber-400">{targetDays} Days</span>
                    </div>
                    <input
                      id="target-days-slider"
                      type="range"
                      min="7"
                      max="60"
                      step="7"
                      value={targetDays}
                      onChange={(e) => setTargetDays(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-white/40 font-mono mt-1">
                      <span>7d (Sprint)</span>
                      <span>14d (Focused)</span>
                      <span>30d (Habit)</span>
                      <span>60d (Mastery)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                      <span className="text-white/70 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Daily Focus
                      </span>
                      <span className="font-mono text-amber-400">{dailyMinutes} Mins/Day</span>
                    </div>
                    <input
                      id="daily-minutes-slider"
                      type="range"
                      min="15"
                      max="120"
                      step="15"
                      value={dailyMinutes}
                      onChange={(e) => setDailyMinutes(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-white/40 font-mono mt-1">
                      <span>15m (Micro)</span>
                      <span>30m (Optimal)</span>
                      <span>60m (Deep)</span>
                      <span>120m (Intensive)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5">
                <button
                  id="confirm-goal-btn"
                  type="button"
                  onClick={handleProceedToEggSelection}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Choose Mythical Egg</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: CHOOSE 3 TYPES OF EGG NATURE */}
        {step === 'egg_selection' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center max-w-2xl mx-auto mb-2">
              <h2 className="text-2xl sm:text-3xl font-serif italic text-white">
                Choose Your Mythical Egg Nature
              </h2>
              <p className="text-sm text-white/50 mt-1">
                Your egg will hatch and evolve through 4 stages (Egg → Hatchling → Juvenile → Awakened) as you complete daily goals and roadmap tasks.
              </p>
            </div>

            {/* 3 Archetype Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* EGG 1: Green Baby Alien & Cosmos */}
              {renderEggCard('green_alien_cosmos', selectedCreatureType, handleSelectEgg)}

              {/* EGG 2: Phoenix Baby Dragon & Lava */}
              {renderEggCard('phoenix_dragon_lava', selectedCreatureType, handleSelectEgg)}

              {/* EGG 3: Golden Celestial Wolf */}
              {renderEggCard('golden_celestial_wolf', selectedCreatureType, handleSelectEgg)}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep('dialogue')}
                className="px-4 py-2 text-xs text-white/50 hover:text-white transition-colors cursor-pointer font-mono"
              >
                ← Back to Goal Chat
              </button>

              <button
                id="select-egg-confirm-btn"
                type="button"
                onClick={handleProceedToNaming}
                className="py-3.5 px-8 rounded-2xl bg-white hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Bond with this Egg</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: NAMING & AI ROADMAP SYNTHESIS */}
        {step === 'naming_and_synthesis' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden"
          >
            {isSynthesizing ? (
              <div className="text-center py-12 space-y-6">
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <CreatureAvatar
                    type={selectedCreatureType}
                    stage="egg"
                    size="xl"
                    isInteracting={true}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif italic text-white flex items-center justify-center gap-2">
                    <Wand2 className="w-5 h-5 text-amber-400 animate-spin" />
                    Generating Your Personal Day-by-Day Roadmap
                  </h3>
                  <p className="text-sm text-amber-400 animate-pulse font-mono">
                    {synthesisStepText}
                  </p>
                  <p className="text-xs text-white/50 max-w-md mx-auto">
                    Gemini is decomposing your goal into daily quests, priority tags, and milestone checkpoints for your {targetDays}-day timeline.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left: Chosen Egg Visual Showcase */}
                <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                  <CreatureAvatar
                    type={selectedCreatureType}
                    stage="egg"
                    size="hero"
                    showAura={true}
                  />
                  <div className="mt-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-amber-400 border border-white/10 font-mono uppercase tracking-wider">
                      {CREATURE_ARCHETYPES[selectedCreatureType].element} Egg
                    </span>
                    <h3 className="text-xl font-serif italic text-white mt-2">
                      {CREATURE_ARCHETYPES[selectedCreatureType].stages.egg.name}
                    </h3>
                    <p className="text-xs text-white/50 mt-1 max-w-xs">
                      {CREATURE_ARCHETYPES[selectedCreatureType].stages.egg.desc}
                    </p>
                  </div>
                </div>

                {/* Right: Companion Naming & Goal Confirmation */}
                <div className="space-y-5">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Final Step</span>
                    <h2 className="text-2xl font-serif italic text-white mt-0.5">
                      Name Your Companion & Hatch Path
                    </h2>
                    <p className="text-xs text-white/50 mt-1">
                      Give your companion egg a noble name. It will cheer you on, offer daily whispers, and grow alongside your achievements.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Creature Companion Nickname:
                    </label>
                    <input
                      id="creature-name-input"
                      type="text"
                      value={creatureName}
                      onChange={(e) => setCreatureName(e.target.value)}
                      placeholder="e.g. Sprout, Ignis, Nova, Astral Pup"
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 focus:border-amber-400 rounded-2xl text-white text-sm outline-none"
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-white/80">
                    <div className="flex justify-between">
                      <span className="text-white/40">Core Goal:</span>
                      <span className="font-semibold text-white truncate max-w-[200px]">{goalTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Duration:</span>
                      <span className="font-mono text-amber-400">{targetDays} Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Daily Commitment:</span>
                      <span className="font-mono text-amber-400">{dailyMinutes} mins/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Companion Archetype:</span>
                      <span className="font-semibold text-amber-400">{CREATURE_ARCHETYPES[selectedCreatureType].name}</span>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                      <p className="text-rose-300 text-xs">{errorMessage}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const fallback = createFallbackRoadmap();
                          onCompleteOnboarding(
                            {
                              title: goalTitle || 'Personal Mastery',
                              description: goalDescription || 'Steady daily progress',
                              targetDays: targetDays || 14,
                              dailyMinutes: dailyMinutes || 30,
                            },
                            selectedCreatureType,
                            creatureName || 'Astral Companion',
                            fallback
                          );
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-amber-400 text-black font-semibold text-xs text-center cursor-pointer hover:bg-amber-300 transition-colors"
                      >
                        Enter Sanctuary Now →
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSynthesizing}
                      onClick={() => setStep('egg_selection')}
                      className="px-4 py-3 text-xs text-white/40 hover:text-white transition-colors cursor-pointer font-mono disabled:opacity-40"
                    >
                      ← Back
                    </button>
                    <button
                      id="hatch-creature-btn"
                      type="button"
                      disabled={isSynthesizing}
                      onClick={handleGenerateAndHatch}
                      className="flex-1 py-4 px-6 rounded-2xl bg-white hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSynthesizing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                          <span>Forging Sanctuary...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Hatch Egg & Generate Roadmap</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Sub-helper for the 3 Egg Archetype Cards
function renderEggCard(
  type: CreatureType,
  selectedType: CreatureType,
  onSelect: (type: CreatureType) => void
) {
  const info = CREATURE_ARCHETYPES[type];
  const isSelected = selectedType === type;

  const typeIcons: Record<CreatureType, React.ReactNode> = {
    green_alien_cosmos: <Leaf className="w-4 h-4 text-emerald-400" />,
    phoenix_dragon_lava: <Flame className="w-4 h-4 text-orange-400" />,
    golden_celestial_wolf: <Sun className="w-4 h-4 text-amber-400" />,
  };

  return (
    <div
      id={`egg-card-${type}`}
      onClick={() => onSelect(type)}
      className={`relative rounded-3xl p-6 cursor-pointer transition-all border backdrop-blur-md ${
        isSelected
          ? 'bg-white/10 border-amber-400 ring-1 ring-amber-400/40 shadow-2xl'
          : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/5'
      }`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 text-amber-400">
          <CheckCircle2 className="w-5 h-5 fill-amber-400/20" />
        </div>
      )}

      {/* Egg Visual Avatar */}
      <div className="h-44 w-full flex items-center justify-center relative my-2">
        <CreatureAvatar type={type} stage="egg" size="lg" isInteracting={isSelected} />
      </div>

      <div className="space-y-2 mt-3">
        <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/60">
          {typeIcons[type]}
          <span>{info.element}</span>
        </div>

        <h3 className="text-lg font-serif italic text-white">
          {info.name}
        </h3>

        <p className="text-xs text-white/50 line-clamp-2">
          {info.description}
        </p>

        {/* Evolution Preview Badges */}
        <div className="pt-2 border-t border-white/5">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">Evolution Stages:</span>
          <div className="flex flex-wrap gap-1 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-white/60">Egg (Lv1)</span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-white/60">Hatchling (Lv2)</span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-white/60">Juvenile (Lv4)</span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-amber-400/30 text-amber-400">Awakened (Lv8)</span>
          </div>
        </div>

        {/* Perks */}
        <div className="pt-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block mb-1">Companion Perk:</span>
          <p className="text-xs text-white/80 italic">
            ✦ {info.perks[0]}
          </p>
        </div>
      </div>
    </div>
  );
}
