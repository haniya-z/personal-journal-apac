import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  Award,
  Flame
} from 'lucide-react';
import { CreatureType, EvolutionStage } from '../types';
import { CreatureAvatar } from './CreatureAvatar';
import { soundFx } from '../utils/audio';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMinutes?: number;
  taskTitle?: string;
  creatureType: CreatureType;
  creatureStage: EvolutionStage;
  creatureName: string;
  onCompleteFocusSession: (minutes: number, xpReward: number, stardustReward: number) => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  initialMinutes = 25,
  taskTitle,
  creatureType,
  creatureStage,
  creatureName,
  onCompleteFocusSession,
}) => {
  const [durationMinutes, setDurationMinutes] = useState(initialMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    setDurationMinutes(initialMinutes);
    setSecondsRemaining(initialMinutes * 60);
    setIsActive(false);
    setSessionCompleted(false);
  }, [initialMinutes, isOpen]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
      setSessionCompleted(true);
      soundFx.playLevelUp();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.5 },
      });
      const earnedXp = durationMinutes * 2;
      const earnedStardust = Math.round(durationMinutes * 0.8);
      onCompleteFocusSession(durationMinutes, earnedXp, earnedStardust);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining, durationMinutes]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    soundFx.playClick();
    setIsActive(!isActive);
  };

  const handleReset = () => {
    soundFx.playClick();
    setIsActive(false);
    setSecondsRemaining(durationMinutes * 60);
    setSessionCompleted(false);
  };

  const handleSelectPreset = (mins: number) => {
    soundFx.playClick();
    setIsActive(false);
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    setSessionCompleted(false);
  };

  const progressPercent = ((durationMinutes * 60 - secondsRemaining) / (durationMinutes * 60)) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          className="w-full max-w-md bg-[#09090f] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-white/40 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Title */}
          <div className="text-center mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 px-3 py-1 rounded-full bg-white/5 border border-white/10 inline-block mb-1.5">
              Astral Deep Focus
            </span>
            <h3 className="text-xl font-serif italic text-white">
              {taskTitle || 'Focused Productivity Session'}
            </h3>
          </div>

          {/* Creature Cheering In Center */}
          <div className="h-36 w-full flex flex-col items-center justify-center relative my-2">
            <CreatureAvatar
              type={creatureType}
              stage={creatureStage}
              size="md"
              isInteracting={isActive}
              interactionType={isActive ? 'meditate' : undefined}
            />
            <p className="text-[11px] text-white/50 italic mt-2">
              {isActive ? `${creatureName} is focusing alongside you...` : `${creatureName} is waiting for your signal.`}
            </p>
          </div>

          {/* Time Display */}
          <div className="text-center my-4">
            <div className="text-5xl font-mono font-extrabold text-white tracking-tight">
              {formatTime(secondsRemaining)}
            </div>

            {/* Progress */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-4 p-0.5">
              <motion.div
                className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Presets */}
          {!isActive && !sessionCompleted && (
            <div className="flex justify-center gap-2 mb-6">
              {[15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSelectPreset(mins)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    durationMinutes === mins
                      ? 'bg-white text-black font-bold uppercase shadow-md'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}

          {/* Session Complete Reward Message */}
          {sessionCompleted && (
            <div className="p-4 bg-white/5 border border-amber-500/30 rounded-2xl text-center text-xs text-amber-300 mb-5 space-y-1">
              <span className="font-bold flex items-center justify-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" /> Focus Session Mastered!
              </span>
              <p className="text-white/80">+{durationMinutes * 2} XP & +{Math.round(durationMinutes * 0.8)} Astral Stardust awarded!</p>
            </div>
          )}

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleReset}
              title="Reset Timer"
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleToggleTimer}
              className="py-3.5 px-8 rounded-2xl bg-white hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-black" />}
              <span>{isActive ? 'Pause Focus' : 'Start Focus'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
