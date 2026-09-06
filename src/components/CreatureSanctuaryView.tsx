import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Heart, 
  Flame, 
  Zap, 
  Award, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  MessageSquare, 
  RefreshCw, 
  ShieldCheck, 
  TrendingUp,
  Sliders
} from 'lucide-react';
import { UserProfile, EvolutionStage } from '../types';
import { CREATURE_ARCHETYPES, calculateLevelData } from '../utils/creatureData';
import { CreatureAvatar } from './CreatureAvatar';
import { soundFx } from '../utils/audio';

interface CreatureSanctuaryViewProps {
  profile: UserProfile;
  onFeedCreature: () => void;
  onPetCreature: () => void;
  onInteractAction: (action: string) => void;
  onHatchCreature?: () => void;
  creatureDialogue: string;
  onUpdateCreatureName: (newName: string) => void;
}

export const CreatureSanctuaryView: React.FC<CreatureSanctuaryViewProps> = ({
  profile,
  onFeedCreature,
  onPetCreature,
  onInteractAction,
  onHatchCreature,
  creatureDialogue,
  onUpdateCreatureName,
}) => {
  const { creature, stardust, tasks, journalEntries, streak, growthTimeline } = profile;
  const archetype = CREATURE_ARCHETYPES[creature.type];
  const levelInfo = calculateLevelData(creature.xp);

  const [interactionFeedback, setInteractionFeedback] = useState<string | null>(null);
  const [crackCount, setCrackCount] = useState<number>(0);
  const [isHatching, setIsHatching] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(creature.name);

  const stagesList: EvolutionStage[] = ['egg', 'baby', 'juvenile', 'awakened'];
  const stageUnlockLevels: Record<EvolutionStage, number> = {
    egg: 1,
    baby: 2,
    hatchling: 2,
    juvenile: 4,
    awakened: 8,
  };

  const handleTapEgg = () => {
    if (creature.stage !== 'egg' || isHatching) return;
    const nextCracks = Math.min(3, crackCount + 1);
    setCrackCount(nextCracks);
    soundFx.playEggCrack(nextCracks);
    setInteractionFeedback('crack');
    setTimeout(() => setInteractionFeedback(null), 1000);

    if (nextCracks >= 3) {
      handleTriggerHatch();
    }
  };

  const handleTriggerHatch = async () => {
    if (isHatching) return;
    setIsHatching(true);
    setInteractionFeedback('crack');
    soundFx.playEggCrack(3);
    setTimeout(async () => {
      try {
        await onHatchCreature?.();
        setCrackCount(0);
      } finally {
        setIsHatching(false);
      }
    }, 500);
  };

  const handleFeed = () => {
    if (stardust < 10) return;
    soundFx.playFeed();
    setInteractionFeedback('feed');
    onFeedCreature();
    setTimeout(() => setInteractionFeedback(null), 1200);
  };

  const handlePet = () => {
    soundFx.playPet(creature.type);
    setInteractionFeedback('pet');
    onPetCreature();
    setTimeout(() => setInteractionFeedback(null), 1200);
  };

  const handleAction = (action: string) => {
    soundFx.playClick();
    setInteractionFeedback(action);
    onInteractAction(action);
    setTimeout(() => setInteractionFeedback(null), 1200);
  };

  const handleSaveName = () => {
    soundFx.playClick();
    if (tempName.trim()) {
      onUpdateCreatureName(tempName.trim());
    }
    setIsEditingName(false);
  };

  // Stats calculation
  const totalTasksCompleted = tasks.filter((t) => t.completed).length;
  const totalJournalEntries = journalEntries.length;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs uppercase tracking-[0.25em] text-amber-500 font-bold">
              Astral Sanctuary
            </span>
            <span className="text-[11px] text-white/40 font-mono ml-2">
              Level {levelInfo.level} · {creature.stage.toUpperCase()} Tier
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif italic text-white tracking-tight">
            {creature.name}'s Astral Habitat
          </div>
          <p className="text-sm text-white/50 max-w-2xl">
            Nurture your mythical companion through daily discipline. As you conquer goals, its celestial power awakens.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-amber-400 text-xs font-mono self-start md:self-auto relative z-10">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Stardust: {stardust}</span>
        </div>
      </div>

      {/* Main Sanctuary Grid: Left Creature Showcase & Care / Right Evolution Path & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hero Interactive Creature & Care Panel (6 Cols) */}
        <div className="lg:col-span-6 bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between space-y-6">
          {/* Top Stage Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="px-3 py-1 bg-white/5 border border-amber-400 rounded-xl text-sm text-white outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-3 py-1 bg-white text-black font-bold uppercase tracking-wider rounded-xl text-xs"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-serif italic text-white">
                    {creature.name}
                  </h2>
                  <button
                    onClick={() => { soundFx.playClick(); setIsEditingName(true); }}
                    className="text-[11px] text-white/40 hover:text-amber-400 cursor-pointer font-mono"
                  >
                    (Rename)
                  </button>
                </div>
              )}
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-400 font-mono">
              Affinity: {creature.affinity}%
            </span>
          </div>

          {/* Egg Awakening Prompt Banner in Sanctuary */}
          {creature.stage === 'egg' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-2 border-amber-500/40 rounded-2xl p-4 my-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
                  🐣
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Egg Ready to Hatch!
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-mono font-bold">
                      {crackCount}/3 Cracks
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mt-0.5">
                    Tap the egg shell or trigger the hatch sequence to awaken your baby celestial companion.
                  </p>
                </div>
              </div>

              <button
                id="sanctuary-crack-egg-cta-btn"
                type="button"
                onClick={handleTriggerHatch}
                disabled={isHatching}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isHatching ? 'Awakening...' : 'Crack & Hatch Now!'}</span>
              </button>
            </motion.div>
          )}

          {/* Creature Avatar in Full Hero Size */}
          <div className="flex flex-col items-center justify-center relative my-4">
            {/* Live Creature Dialogue */}
            <motion.div
              key={creatureDialogue}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-sm bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white/90 mb-4 shadow-xl text-center relative backdrop-blur-md"
            >
              <span className="italic">"{creatureDialogue || `${creature.name} pulses with celestial energy!`}"</span>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#09090f] border-r border-b border-white/10 rotate-45" />
            </motion.div>

            <div
              id="sanctuary-creature-avatar-container"
              onClick={creature.stage === 'egg' ? handleTapEgg : undefined}
              className={`h-60 sm:h-72 w-full flex items-center justify-center ${creature.stage === 'egg' ? 'cursor-pointer group' : ''}`}
              title={creature.stage === 'egg' ? 'Click egg to crack the shell!' : undefined}
            >
              <CreatureAvatar
                type={creature.type}
                stage={creature.stage}
                size="hero"
                isInteracting={!!interactionFeedback}
                interactionType={interactionFeedback}
                showAura={true}
                crackLevel={crackCount}
                className={creature.stage === 'egg' ? 'transition-transform group-hover:scale-105 active:scale-95' : ''}
              />
            </div>

            <div className="text-center mt-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block">
                {archetype.stages[creature.stage]?.name}
              </span>
              <p className="text-xs text-white/50 max-w-xs mx-auto mt-0.5">
                {archetype.stages[creature.stage]?.desc}
              </p>
              {creature.stage === 'egg' && (
                <span className="mt-1.5 inline-block text-[10px] text-amber-400/80 font-mono tracking-wider animate-pulse">
                  ⚡ Tap egg shell to fracture ({crackCount}/3)
                </span>
              )}
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Evolution Progress (Level {levelInfo.level})
              </span>
              <span className="text-amber-400 font-mono">
                {levelInfo.xpInLevel} / {levelInfo.xpNeeded} XP ({Math.round(levelInfo.progressPercent)}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
              <motion.div
                className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progressPercent}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>Vitality: {creature.vitality}%</span>
              <span>Energy: {creature.energy}%</span>
            </div>
          </div>

          {/* Care Actions Grid */}
          <div className="grid grid-cols-3 gap-3">
            {creature.stage === 'egg' ? (
              <>
                <button
                  id="sanctuary-feed-btn"
                  type="button"
                  onClick={handleFeed}
                  disabled={stardust < 10}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white hover:text-amber-300 disabled:opacity-40 transition-colors flex flex-col items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Feed Stardust</span>
                  <span className="text-[10px] text-white/40 font-mono">-10 Stardust</span>
                </button>

                <button
                  id="sanctuary-crack-tap-btn"
                  type="button"
                  onClick={handleTapEgg}
                  disabled={isHatching}
                  className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-300 transition-colors flex flex-col items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Crack Shell</span>
                  <span className="text-[10px] text-amber-400/70 font-mono">{crackCount}/3 Cracks</span>
                </button>

                <button
                  id="sanctuary-hatch-now-btn"
                  type="button"
                  onClick={handleTriggerHatch}
                  disabled={isHatching}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-xs font-medium text-amber-200 transition-colors flex flex-col items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{isHatching ? 'Hatching...' : 'Crack & Hatch!'}</span>
                  <span className="text-[10px] text-amber-300/80 font-mono">Awaken Baby</span>
                </button>
              </>
            ) : (
              <>
                <button
                  id="sanctuary-feed-btn"
                  type="button"
                  onClick={handleFeed}
                  disabled={stardust < 10}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white hover:text-amber-300 disabled:opacity-40 transition-colors flex flex-col items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Feed Stardust</span>
                  <span className="text-[10px] text-white/40 font-mono">-10 Stardust</span>
                </button>

                <button
                  id="sanctuary-pet-btn"
                  type="button"
                  onClick={handlePet}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white hover:text-rose-300 transition-colors flex flex-col items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Pet Companion</span>
                  <span className="text-[10px] text-white/40 font-mono">+Affinity</span>
                </button>

                <button
                  id="sanctuary-ask-gemini-btn"
                  type="button"
                  onClick={() => handleAction('talk')}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white hover:text-amber-300 transition-colors flex flex-col items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Ask Companion</span>
                  <span className="text-[10px] text-white/40 font-mono">Gemini Voice</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: 4 Evolution Stages & Growth Dashboard (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Evolution Pathway Visualizer */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-serif italic text-white">
                  Evolution Milestones
                </h3>
              </div>
              <span className="text-xs text-white/40 font-mono">
                {archetype.name} Lineage
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stagesList.map((stg) => {
                const stageInfo = archetype.stages[stg];
                const reqLevel = stageUnlockLevels[stg];
                const isUnlocked = levelInfo.level >= reqLevel;
                const isCurrent = creature.stage === stg;

                return (
                  <div
                    key={stg}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-white/10 border-amber-400 ring-1 ring-amber-400/40 shadow-lg'
                        : isUnlocked
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white/[0.02] border-white/5 opacity-40'
                    }`}
                  >
                    <div className="h-16 w-full flex items-center justify-center my-1">
                      <CreatureAvatar
                        type={creature.type}
                        stage={stg}
                        size="sm"
                      />
                    </div>
                    <div className="text-xs font-medium text-white truncate mt-1">
                      {stageInfo?.name || stg}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1 font-mono">
                      {isUnlocked ? (
                        <span className="text-amber-400 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-amber-500" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-white/40 flex items-center justify-center gap-1">
                          <Lock className="w-3 h-3" /> Lv {reqLevel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Growth Progress Over Time: Milestones & Stats */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-serif italic text-white">
                  Productivity & Growth History
                </h3>
              </div>
              <span className="text-xs text-white/40 font-mono">Lifetime Stats</span>
            </div>

            {/* Stats Metric Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-center">
                <div className="text-lg font-serif italic text-white">{creature.xp}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Total XP</div>
              </div>
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-center">
                <div className="text-lg font-serif italic text-amber-400">{totalTasksCompleted}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Quests Done</div>
              </div>
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-center">
                <div className="text-lg font-serif italic text-white">{totalJournalEntries}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Journal Logs</div>
              </div>
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-center">
                <div className="text-lg font-serif italic text-amber-400">{streak.current}d</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Streak Record</div>
              </div>
            </div>

            {/* Growth Timeline Log */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs uppercase tracking-wider text-white/60 font-bold block">
                Sanctuary Chronicle Milestones:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {growthTimeline.slice().reverse().map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-white/80">{item.event}</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
