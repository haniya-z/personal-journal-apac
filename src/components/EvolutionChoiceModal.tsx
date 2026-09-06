import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen, Compass, Wand2, ShieldCheck, Loader2 } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface EvolutionChoiceModalProps {
  isOpen: boolean;
  creatureName: string;
  onChoose: (choice: 'SCHOLAR' | 'ADVENTURER' | 'CREATOR') => Promise<void>;
}

export const EvolutionChoiceModal: React.FC<EvolutionChoiceModalProps> = ({
  isOpen,
  creatureName,
  onChoose,
}) => {
  const [selected, setSelected] = useState<'SCHOLAR' | 'ADVENTURER' | 'CREATOR'>('SCHOLAR');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const choices = [
    {
      id: 'SCHOLAR' as const,
      title: 'The Scholar',
      tagline: 'Intellectual Synthesis & Deep Wisdom',
      icon: BookOpen,
      gradient: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
      activeBorder: 'border-blue-400 bg-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.25)]',
      accentColor: 'text-blue-400',
      desc: 'Master the arts of analytical focus, deep work synthesis, and systematic problem solving. Ideal for researchers, engineers, and lifelong learners.',
    },
    {
      id: 'ADVENTURER' as const,
      title: 'The Adventurer',
      tagline: 'Courage, Endurance & Frontier Grit',
      icon: Compass,
      gradient: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
      activeBorder: 'border-amber-400 bg-amber-500/10 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      accentColor: 'text-amber-400',
      desc: 'Conquer ambitious goals, push past resistance, and cultivate relentless daily discipline through high-intensity execution.',
    },
    {
      id: 'CREATOR' as const,
      title: 'The Creator',
      tagline: 'Artistry, Flow & Visionary Craft',
      icon: Wand2,
      gradient: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
      activeBorder: 'border-purple-400 bg-purple-500/10 shadow-[0_0_25px_rgba(168,85,247,0.25)]',
      accentColor: 'text-purple-400',
      desc: 'Channel intuitive inspiration, manifest original concepts into reality, and sustain luminous creative momentum.',
    },
  ];

  const handleConfirm = async () => {
    soundFx.playLevelUp();
    setSubmitting(true);
    setError('');
    try {
      await onChoose(selected);
    } catch (err: any) {
      console.error('Evolution choice error:', err);
      setError(err.message || 'Failed to submit evolution choice to server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#090912] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden my-8"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[60px] pointer-events-none" />

        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto mb-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Sparkles className="w-7 h-7" />
        </div>

        <div className="text-[11px] uppercase tracking-[0.25em] text-amber-400 font-bold mb-1">
          Server-Verified Evolution Milestone Reached (500+ XP)
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif italic text-white tracking-tight mb-2">
          Awaken {creatureName}&apos;s Master Archetype
        </h2>
        <p className="text-xs text-white/60 max-w-md mx-auto mb-6 leading-relaxed">
          Your steady productivity has brought {creatureName} to a major evolutionary threshold. Choose the guiding path that will define their awakened form:
        </p>

        {/* 3 Choices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left mb-6">
          {choices.map((c) => {
            const Icon = c.icon;
            const isSelected = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSelected(c.id);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                  isSelected
                    ? c.activeBorder
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${c.accentColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                        Selected
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mb-0.5">{c.title}</h3>
                  <div className={`text-[10px] font-mono mb-2 ${c.accentColor}`}>{c.tagline}</div>
                  <p className="text-[11px] text-white/60 leading-relaxed">{c.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs mb-4 text-left">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          id="confirm-evolution-btn"
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-bold uppercase tracking-widest rounded-2xl text-xs transition-all shadow-[0_0_30px_rgba(245,158,11,0.35)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying & Awakening Companion...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm & Awaken as {selected}</span>
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};
