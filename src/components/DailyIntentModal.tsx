import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Compass, 
  Clock, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  BookOpen, 
  Wand2, 
  Flame,
  Target,
  Lightbulb
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { apiCreateJourney, apiApplyJourney } from '../lib/api';
import confetti from 'canvas-confetti';

interface DailyIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJourneyApplied: (newQuest: any, newTasks: any[]) => void;
  currentGoalTitle?: string;
  userEmail?: string;
}

const INSPIRATION_PILLS = [
  { label: 'Learn TypeScript & React Patterns', topic: 'Modern TypeScript, generics, hooks, and clean architecture' },
  { label: 'Master AI & Prompt Engineering', topic: 'LLM fine-tuning, system instructions, function calling, and agentic workflows' },
  { label: 'Build a Full-Stack REST API', topic: 'Node.js, Express, database schemas, authentication, and endpoint testing' },
  { label: 'Draft 2,000 Words for Manuscript', topic: 'Character development, narrative pacing, and deep writing flow' },
  { label: 'Master Algorithmic Problem Solving', topic: 'Data structures, graphs, dynamic programming, and complexity analysis' },
  { label: 'Establish 45-Min Deep Focus Habit', topic: 'Distraction-free time-blocking, mindful transitions, and reflection' },
];

export const DailyIntentModal: React.FC<DailyIntentModalProps> = ({
  isOpen,
  onClose,
  onJourneyApplied,
  currentGoalTitle,
  userEmail,
}) => {
  const [intentInput, setIntentInput] = useState('');
  const [targetDays, setTargetDays] = useState<number>(14);
  const [dailyMinutes, setDailyMinutes] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [generatedJourney, setGeneratedJourney] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSelectInspiration = (topic: string) => {
    soundFx.playClick();
    setIntentInput(topic);
    setErrorMessage('');
  };

  const handleGenerateJourney = async () => {
    const cleanIntent = intentInput.trim();
    if (!cleanIntent) {
      setErrorMessage('Please describe what you want to learn or accomplish today.');
      return;
    }

    soundFx.playClick();
    setErrorMessage('');
    setIsGenerating(true);

    try {
      const res = await apiCreateJourney({
        intent: cleanIntent,
        targetDays,
        dailyMinutes,
      });

      if (res.journey) {
        setGeneratedJourney(res.journey);
        soundFx.playLevelUp();
      } else {
        throw new Error('No journey returned by Gemini.');
      }
    } catch (err: any) {
      console.error('Error generating journey:', err);
      setErrorMessage(err.message || 'Failed to synthesize journey with Gemini. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyJourney = async () => {
    if (!generatedJourney) return;

    soundFx.playClick();
    setIsApplying(true);
    setErrorMessage('');

    try {
      const res = await apiApplyJourney({
        journey: generatedJourney,
        targetDays,
        dailyMinutes,
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#38bdf8', '#ffffff'],
      });
      soundFx.playLevelUp();

      onJourneyApplied(res.activeQuest, res.tasks);
      onClose();
    } catch (err: any) {
      console.error('Error applying journey:', err);
      setErrorMessage(err.message || 'Failed to apply journey to today horizon.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-[#0b0c12] border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-[#e0e0e0] shadow-2xl relative overflow-hidden my-auto"
      >
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Modal Close Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini Daily Intent & Journey Architect
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
            What do you want to learn or accomplish today?
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Gemini will architect a customized daily journey, milestones, and actionable tasks to structure your focus and nurture your sanctuary companion.
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Step 1: Input & Parameters */}
        {!generatedJourney ? (
          <div className="space-y-6">
            {/* Input field */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/70 flex items-center justify-between">
                <span>Today's Learning or Accomplishment Ambition</span>
                {currentGoalTitle && (
                  <span className="text-amber-400/80 font-normal">Current Goal: {currentGoalTitle}</span>
                )}
              </label>
              <textarea
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                placeholder="e.g., Master React Server Components, learn Python data analysis, finish draft for chapter 2, or build my portfolio site..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30 transition-all resize-none"
              />
            </div>

            {/* Quick Inspiration Pills */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-white/50 font-mono">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick inspirations (click to select):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INSPIRATION_PILLS.map((pill, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectInspiration(pill.topic)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 text-white/70 hover:text-amber-200 transition-all text-left"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline & Commitment Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Target Timeline
                  </span>
                  <span className="font-bold text-amber-300">{targetDays} Days</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setTargetDays(days);
                      }}
                      className={`py-1.5 text-xs rounded-xl font-medium transition-all ${
                        targetDays === days
                          ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Daily Commitment
                  </span>
                  <span className="font-bold text-amber-300">{dailyMinutes} Mins/Day</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[25, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setDailyMinutes(mins);
                      }}
                      className={`py-1.5 text-xs rounded-xl font-medium transition-all ${
                        dailyMinutes === mins
                          ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {mins} Mins
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGenerating || !intentInput.trim()}
                onClick={handleGenerateJourney}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Synthesizing Journey...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Synthesize Journey with Gemini
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Journey Preview & Launch */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Synthesized Journey
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {targetDays} Days • {dailyMinutes} mins/day
                </span>
              </div>
              <h3 className="text-xl font-bold text-white font-serif">
                {generatedJourney.journeyTitle}
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                {generatedJourney.overview}
              </p>
              {generatedJourney.mentorAdvice && (
                <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Gemini Advice:</strong> {generatedJourney.mentorAdvice}</span>
                </div>
              )}
            </div>

            {/* Today's Recommended Tasks */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-white/60 flex items-center justify-between">
                <span>Today's Actionable Focus Steps (Day 1)</span>
                <span className="text-amber-400">{generatedJourney.todaysTasks?.length || 0} Tasks</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(generatedJourney.todaysTasks || []).map((t: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-mono font-bold text-amber-300">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{t.title}</div>
                        {t.stepTip && (
                          <div className="text-xs text-white/50">{t.stepTip}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-white/70">
                        {t.estimatedMinutes || 25}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setGeneratedJourney(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors"
              >
                Back to Intent
              </button>
              <button
                type="button"
                disabled={isApplying}
                onClick={handleApplyJourney}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Launching Journey...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Launch Today's Journey
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
