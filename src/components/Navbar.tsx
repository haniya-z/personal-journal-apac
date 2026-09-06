import React from 'react';
import { 
  Sparkles, 
  Flame, 
  Compass, 
  CheckSquare, 
  BookOpen, 
  Crown, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Heart,
  Timer,
  Settings
} from 'lucide-react';
import { UserProfile } from '../types';
import { CREATURE_ARCHETYPES } from '../utils/creatureData';
import { soundFx } from '../utils/audio';

export type TabType = 'dashboard' | 'roadmap' | 'tasks' | 'journal' | 'sanctuary';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  profile: UserProfile;
  onOpenFocusTimer: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSupportChat?: () => void;
  onOpenDailyIntent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  onOpenFocusTimer,
  onOpenSettings,
  onLogout,
  soundEnabled,
  onToggleSound,
  onOpenSupportChat,
  onOpenDailyIntent,
}) => {
  const creatureInfo = CREATURE_ARCHETYPES[profile.creature.type];

  const handleTabClick = (tab: TabType) => {
    soundFx.playClick();
    onSelectTab(tab);
  };

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Crown },
    { id: 'roadmap' as TabType, label: 'AI Roadmap', icon: Compass },
    { id: 'tasks' as TabType, label: 'Daily Quests', icon: CheckSquare },
    { id: 'journal' as TabType, label: 'Digital Journal', icon: BookOpen },
    { id: 'sanctuary' as TabType, label: 'Growth Sanctuary', icon: Heart },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#050508]/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: App Logo & Creature Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTabClick('dashboard')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-yellow-200 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-5 h-5 border-2 border-black/80 rounded-sm rotate-45 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-black rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-[0.25em] text-amber-500">
                  Astral Odyssey
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80 font-mono">
                  Lvl {profile.creature.level}
                </span>
              </div>
              <div className="text-sm font-serif italic text-white truncate max-w-[150px] sm:max-w-[220px]">
                {profile.creature.name}
              </div>
            </div>
          </button>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-white/[0.03] border border-white/10 p-1.5 rounded-2xl backdrop-blur-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Active Identity, Currency, Streak, Timer, Audio & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Active Identity Pill (From Design HTML) */}
          <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-widest text-white/40 leading-none mb-0.5">Active Identity</div>
              <div className="text-xs font-medium text-white/90 truncate max-w-[120px]">{profile.email}</div>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 border border-white/20 flex items-center justify-center text-[10px] font-mono text-white/70">
              {profile.email.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-amber-400 text-xs font-mono" title="Daily Streak">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{profile.streak.current}d</span>
          </div>

          {/* Stardust Balance */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-amber-300 text-xs font-mono" title="Astral Stardust for feeding & evolution">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{profile.stardust}</span>
          </div>

          {/* Daily Intent / Plan Journey button */}
          {onOpenDailyIntent && (
            <button
              id="open-daily-intent-btn"
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenDailyIntent();
              }}
              title="Plan What You Want to Learn or Accomplish with Gemini"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-medium transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Plan Journey</span>
            </button>
          )}

          {/* Gemini Support Chatbot button */}
          {onOpenSupportChat && (
            <button
              id="open-gemini-support-btn"
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenSupportChat();
              }}
              title="Gemini Support & Learning Chatbot"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-white/80 hover:text-amber-300 text-xs font-medium transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden md:inline">Gemini Support</span>
            </button>
          )}

          {/* Quick Focus Timer Button */}
          <button
            id="open-focus-timer-btn"
            type="button"
            onClick={onOpenFocusTimer}
            title="Open Focus Timer"
            className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 text-white/70 hover:text-amber-400 transition-all cursor-pointer"
          >
            <Timer className="w-4 h-4" />
          </button>

          {/* Sound FX Toggle */}
          <button
            id="toggle-sound-btn"
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings & Integrations Modal Trigger */}
          <button
            id="open-settings-btn"
            type="button"
            onClick={onOpenSettings}
            title="Settings → Integrations"
            className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 text-white/60 hover:text-amber-400 transition-all cursor-pointer relative"
          >
            <Settings className="w-4 h-4" />
            {profile.calendarConnected && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-[#050508]" />
            )}
          </button>

          {/* User Account / Logout Switcher */}
          <button
            id="user-logout-btn"
            type="button"
            onClick={onLogout}
            title={`Logged in as ${profile.email} - Click to switch profile`}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-white/60 hover:text-rose-400 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050508]/95 border-t border-white/10 backdrop-blur-md px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] transition-all ${
                isActive ? 'text-amber-400 font-bold bg-white/5' : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
