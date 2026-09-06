import React from 'react';
import { motion } from 'motion/react';
import { CreatureStage, CreatureType } from '../types';

interface CreatureAvatarProps {
  type: CreatureType;
  stage: CreatureStage;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  isInteracting?: boolean;
  interactionType?: string | null;
  className?: string;
  showAura?: boolean;
  crackLevel?: number;
}

export const CreatureAvatar: React.FC<CreatureAvatarProps> = ({
  type,
  stage,
  size = 'lg',
  isInteracting = false,
  interactionType = null,
  className = '',
  showAura = true,
  crackLevel = 0,
}) => {
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-24 h-24',
    lg: 'w-44 h-44',
    xl: 'w-60 h-60',
    hero: 'w-72 h-72 sm:w-80 sm:h-80',
  };

  // Color schemes
  const colorMap = {
    green_alien_cosmos: {
      primary: '#10b981',
      secondary: '#064e3b',
      accent: '#34d399',
      highlight: '#a7f3d0',
      glow: 'rgba(16, 185, 129, 0.45)',
      ring: '#059669',
    },
    phoenix_dragon_lava: {
      primary: '#f97316',
      secondary: '#7c2d12',
      accent: '#fb923c',
      highlight: '#fed7aa',
      glow: 'rgba(249, 115, 22, 0.45)',
      ring: '#ea580c',
    },
    golden_celestial_wolf: {
      primary: '#eab308',
      secondary: '#713f12',
      accent: '#fde047',
      highlight: '#fef08a',
      glow: 'rgba(234, 179, 8, 0.45)',
      ring: '#ca8a04',
    },
  };

  const currentColors = colorMap[type] || colorMap.golden_celestial_wolf;

  // Animation variants
  const idleAnimation = {
    y: [0, -8, 0],
    rotate: [0, 1.5, -1.5, 0],
    transition: {
      duration: stage === 'egg' ? 3.5 : 4,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  };

  const reactingAnimation = {
    scale: [1, 1.15, 0.95, 1.08, 1],
    rotate: [0, -6, 6, -3, 0],
    y: [0, -18, 0],
    transition: {
      duration: 0.8,
      ease: 'easeOut' as const,
    },
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {/* Background Aura Glow */}
      {showAura && (
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
          style={{ background: currentColors.glow }}
        />
      )}

      {/* Orbiting Stardust Particles */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 pointer-events-none"
      >
        <span
          className="absolute top-2 left-6 w-2 h-2 rounded-full blur-[0.5px] animate-pulse"
          style={{ backgroundColor: currentColors.highlight }}
        />
        <span
          className="absolute bottom-4 right-8 w-1.5 h-1.5 rounded-full blur-[0.5px]"
          style={{ backgroundColor: currentColors.accent }}
        />
        <span
          className="absolute top-1/2 right-2 w-2 h-2 rounded-full blur-[1px] animate-ping"
          style={{ backgroundColor: currentColors.primary }}
        />
      </motion.div>

      {/* Main Creature SVG Structure */}
      <motion.div
        animate={isInteracting ? reactingAnimation : idleAnimation}
        className="w-full h-full flex items-center justify-center drop-shadow-2xl relative z-10 select-none"
      >
        {/* Render specific creature by type and stage */}
        {type === 'green_alien_cosmos' && renderAlienCosmos(stage, currentColors, crackLevel)}
        {type === 'phoenix_dragon_lava' && renderPhoenixDragon(stage, currentColors, crackLevel)}
        {type === 'golden_celestial_wolf' && renderCelestialWolf(stage, currentColors, crackLevel)}
      </motion.div>

      {/* Floating Reaction Icon / Sparkle when interacting */}
      {isInteracting && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{ opacity: 1, y: -30, scale: 1.2 }}
          exit={{ opacity: 0 }}
          className="absolute -top-4 font-bold text-xl drop-shadow-md z-30 pointer-events-none"
        >
          {interactionType === 'crack' && '⚡ CRACK! 🐣'}
          {interactionType === 'feed' && '✨🍓 +Mana!'}
          {interactionType === 'pet' && '💖 Purr~'}
          {interactionType === 'meditate' && '🧘 Harmony!'}
          {(!interactionType || interactionType === 'talk') && '🌟 ✨'}
        </motion.div>
      )}
    </div>
  );
};

// Helper for visible celestial cracks on egg when tapped
function renderEggCracks(crackLevel: number) {
  if (!crackLevel || crackLevel <= 0) return null;
  return (
    <g className="animate-pulse">
      {/* Primary fissure */}
      <path
        d="M100 48 L94 72 L106 90 L92 118"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        filter="drop-shadow(0 0 6px #fde047)"
      />
      {crackLevel >= 2 && (
        <>
          <path
            d="M94 72 L72 82 L65 104"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="drop-shadow(0 0 6px #fde047)"
          />
          <path
            d="M106 90 L126 104 L132 126"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="drop-shadow(0 0 6px #fde047)"
          />
        </>
      )}
      {crackLevel >= 3 && (
        <>
          <path
            d="M92 118 L114 142 L102 165"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="drop-shadow(0 0 10px #fde047)"
          />
          <path
            d="M72 82 L52 95 L48 118"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            filter="drop-shadow(0 0 8px #fde047)"
          />
          <circle cx="100" cy="95" r="16" fill="#ffffff" filter="blur(6px)" opacity="0.9" />
        </>
      )}
    </g>
  );
}

// 1. GREEN ALIEN & COSMOS RENDERER
function renderAlienCosmos(stage: CreatureStage, colors: any, crackLevel: number = 0) {
  if (stage === 'egg') {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="eggAlienGlow" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={colors.highlight} />
            <stop offset="50%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </radialGradient>
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.accent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Orbit Ring */}
        <ellipse cx="100" cy="115" rx="85" ry="32" fill="none" stroke="url(#orbitGrad)" strokeWidth="3" strokeDasharray="6 4" transform="rotate(-15 100 115)" />
        
        {/* Planetary Satellite */}
        <circle cx="165" cy="85" r="7" fill={colors.highlight} filter="drop-shadow(0 0 6px #34d399)" />

        {/* Egg Shell */}
        <path
          d="M100 28 C138 28 158 85 152 135 C146 172 125 182 100 182 C75 182 54 172 48 135 C42 85 62 28 100 28 Z"
          fill="url(#eggAlienGlow)"
          stroke={colors.accent}
          strokeWidth="3.5"
        />

        {/* Bioluminescent Runes */}
        <path d="M90 65 Q100 55 110 65 T100 85" fill="none" stroke={colors.highlight} strokeWidth="2.5" opacity="0.85" />
        <circle cx="100" cy="105" r="4" fill={colors.highlight} />
        <circle cx="82" cy="125" r="3" fill={colors.highlight} opacity="0.7" />
        <circle cx="118" cy="125" r="3" fill={colors.highlight} opacity="0.7" />
        <path d="M85 145 Q100 155 115 145" fill="none" stroke={colors.highlight} strokeWidth="2" opacity="0.9" />

        {/* Cracking Fissures */}
        {renderEggCracks(crackLevel)}
      </svg>
    );
  }

  if (stage === 'hatchling' || stage === 'baby') {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="alienBodyGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor={colors.highlight} />
            <stop offset="60%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </radialGradient>
        </defs>

        {/* Antennae */}
        <path d="M100 65 Q85 30 75 35" fill="none" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" />
        <circle cx="75" cy="35" r="6" fill={colors.highlight} filter="drop-shadow(0 0 6px #10b981)" />
        
        <path d="M100 65 Q115 30 125 35" fill="none" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" />
        <circle cx="125" cy="35" r="6" fill={colors.highlight} filter="drop-shadow(0 0 6px #10b981)" />

        {/* Sprout Leaf on head */}
        <path d="M100 60 C90 45 95 38 100 35 C105 38 110 45 100 60 Z" fill="#4ade80" />

        {/* Head */}
        <ellipse cx="100" cy="85" rx="42" ry="36" fill="url(#alienBodyGrad)" stroke={colors.accent} strokeWidth="2.5" />

        {/* Big Cosmic Eyes */}
        <ellipse cx="84" cy="82" rx="12" ry="15" fill="#022c22" />
        <circle cx="82" cy="78" r="4.5" fill="#ffffff" />
        <circle cx="87" cy="88" r="2.5" fill={colors.highlight} />

        <ellipse cx="116" cy="82" rx="12" ry="15" fill="#022c22" />
        <circle cx="114" cy="78" r="4.5" fill="#ffffff" />
        <circle cx="119" cy="88" r="2.5" fill={colors.highlight} />

        {/* Cheeks & Cute Smile */}
        <ellipse cx="74" cy="94" rx="4" ry="2" fill="#34d399" opacity="0.6" />
        <ellipse cx="126" cy="94" rx="4" ry="2" fill="#34d399" opacity="0.6" />
        <path d="M95 98 Q100 104 105 98" fill="none" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />

        {/* Tiny Body & Paws */}
        <path d="M80 115 Q100 108 120 115 Q130 145 100 150 Q70 145 80 115 Z" fill="url(#alienBodyGrad)" stroke={colors.accent} strokeWidth="2" />
        <ellipse cx="78" cy="130" rx="8" ry="6" fill={colors.primary} />
        <ellipse cx="122" cy="130" rx="8" ry="6" fill={colors.primary} />
        <ellipse cx="88" cy="150" rx="7" ry="5" fill={colors.secondary} />
        <ellipse cx="112" cy="150" rx="7" ry="5" fill={colors.secondary} />
      </svg>
    );
  }

  if (stage === 'juvenile') {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="alienJuvGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor={colors.highlight} />
            <stop offset="50%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </radialGradient>
        </defs>

        {/* Orbiting Starlight Discs */}
        <ellipse cx="100" cy="100" rx="90" ry="38" fill="none" stroke={colors.accent} strokeWidth="2" strokeDasharray="8 6" transform="rotate(-25 100 100)" />
        <circle cx="160" cy="55" r="5" fill={colors.highlight} filter="drop-shadow(0 0 8px #34d399)" />
        <circle cx="40" cy="145" r="4" fill={colors.highlight} />

        {/* Floating Astral Mantle */}
        <path d="M50 110 Q100 70 150 110 Q140 160 100 175 Q60 160 50 110 Z" fill="rgba(16, 185, 129, 0.2)" stroke={colors.accent} strokeWidth="1.5" />

        {/* Head */}
        <path d="M70 70 C70 40 130 40 130 70 C130 100 70 100 70 70 Z" fill="url(#alienJuvGrad)" stroke={colors.accent} strokeWidth="2.5" />

        {/* Crown Antennae */}
        <path d="M85 45 Q70 15 60 25" fill="none" stroke={colors.accent} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="60" cy="25" r="5" fill={colors.highlight} />
        <path d="M115 45 Q130 15 140 25" fill="none" stroke={colors.accent} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="140" cy="25" r="5" fill={colors.highlight} />
        <circle cx="100" cy="30" r="4" fill={colors.highlight} />

        {/* Telepathic Eyes */}
        <ellipse cx="86" cy="68" rx="10" ry="14" fill="#022c22" />
        <circle cx="85" cy="65" r="4" fill="#ffffff" />
        <ellipse cx="114" cy="68" rx="10" ry="14" fill="#022c22" />
        <circle cx="113" cy="65" r="4" fill="#ffffff" />

        {/* Torso & Levitating Hands */}
        <path d="M82 95 Q100 90 118 95 L112 140 Q100 148 88 140 Z" fill="url(#alienJuvGrad)" />
        <ellipse cx="65" cy="115" rx="7" ry="12" fill={colors.primary} transform="rotate(25 65 115)" />
        <ellipse cx="135" cy="115" rx="7" ry="12" fill={colors.primary} transform="rotate(-25 135 115)" />
        
        {/* Floating Lotus Energy Core */}
        <circle cx="100" cy="118" r="8" fill={colors.highlight} filter="drop-shadow(0 0 10px #10b981)" />
      </svg>
    );
  }

  // Awakened Stage
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id="alienAwakenedCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor={colors.highlight} />
          <stop offset="80%" stopColor={colors.primary} />
          <stop offset="100%" stopColor="#022c22" />
        </radialGradient>
      </defs>

      {/* Cosmic Arbiter Halo */}
      <circle cx="100" cy="100" r="88" fill="none" stroke={colors.accent} strokeWidth="2.5" strokeDasharray="12 6 3 6" opacity="0.8" />
      <circle cx="100" cy="100" r="74" fill="none" stroke={colors.highlight} strokeWidth="1" opacity="0.5" />
      
      {/* 4 Astral Compass Points */}
      <polygon points="100,6 104,18 100,14 96,18" fill={colors.highlight} />
      <polygon points="100,194 104,182 100,186 96,182" fill={colors.highlight} />
      <polygon points="6,100 18,104 14,100 18,96" fill={colors.highlight} />
      <polygon points="194,100 182,104 186,100 182,96" fill={colors.highlight} />

      {/* Ethereal Bio-Wings */}
      <path d="M40 70 Q10 40 25 100 Q45 130 80 120 Z" fill="rgba(52, 211, 153, 0.35)" stroke={colors.accent} strokeWidth="1.5" />
      <path d="M160 70 Q190 40 175 100 Q155 130 120 120 Z" fill="rgba(52, 211, 153, 0.35)" stroke={colors.accent} strokeWidth="1.5" />

      {/* Main Avatar Entity */}
      <path d="M75 55 C75 25 125 25 125 55 C125 90 75 90 75 55 Z" fill="url(#alienAwakenedCore)" stroke={colors.highlight} strokeWidth="2" />
      <circle cx="88" cy="55" r="7" fill="#022c22" />
      <circle cx="87" cy="53" r="2.5" fill="#ffffff" />
      <circle cx="112" cy="55" r="7" fill="#022c22" />
      <circle cx="111" cy="53" r="2.5" fill="#ffffff" />

      {/* Floating Third Eye Diamond */}
      <polygon points="100,32 105,39 100,46 95,39" fill="#ffffff" filter="drop-shadow(0 0 8px #6ee7b7)" />

      {/* Cosmic Armor & Core */}
      <path d="M78 85 L100 70 L122 85 L115 145 L100 160 L85 145 Z" fill="url(#alienAwakenedCore)" stroke={colors.accent} strokeWidth="2" />
      <circle cx="100" cy="110" r="12" fill="#ffffff" filter="drop-shadow(0 0 14px #34d399)" />
    </svg>
  );
}

// 2. PHOENIX DRAGON & LAVA RENDERER
function renderPhoenixDragon(stage: CreatureStage, colors: any, crackLevel: number = 0) {
  if (stage === 'egg') {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="eggLavaGlow" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#431407" />
            <stop offset="60%" stopColor="#1c1917" />
            <stop offset="100%" stopColor="#0c0a09" />
          </radialGradient>
          <linearGradient id="lavaVein" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Rising Embers */}
        <circle cx="65" cy="50" r="3" fill="#f97316" filter="drop-shadow(0 0 4px #ea580c)" />
        <circle cx="145" cy="40" r="4" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)" />
        <circle cx="155" cy="110" r="2.5" fill="#f97316" />

        {/* Volcanic Egg Shell */}
        <path
          d="M100 28 C138 28 158 85 152 135 C146 172 125 182 100 182 C75 182 54 172 48 135 C42 85 62 28 100 28 Z"
          fill="url(#eggLavaGlow)"
          stroke="#ea580c"
          strokeWidth="3.5"
        />

        {/* Glowing Lava Cracks */}
        <path d="M100 45 L92 70 L108 90 L95 120 L105 145 L98 168" fill="none" stroke="url(#lavaVein)" strokeWidth="4" strokeLinecap="round" filter="drop-shadow(0 0 6px #f97316)" />
        <path d="M92 70 L75 80 L68 100" fill="none" stroke="url(#lavaVein)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M108 90 L128 105 L135 128" fill="none" stroke="url(#lavaVein)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M95 120 L80 135" fill="none" stroke="url(#lavaVein)" strokeWidth="2" strokeLinecap="round" />

        {/* Additional Cracking Fissures from User Tap */}
        {renderEggCracks(crackLevel)}
      </svg>
    );
  }

  if (stage === 'hatchling' || stage === 'baby') {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="dragonBodyGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="45%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
        </defs>

        {/* Baby Dragon Wings */}
        <path d="M60 90 Q30 65 35 105 Q55 110 65 100 Z" fill="#ea580c" stroke="#f97316" strokeWidth="2" />
        <path d="M140 90 Q170 65 165 105 Q145 110 135 100 Z" fill="#ea580c" stroke="#f97316" strokeWidth="2" />

        {/* Fiery Tail */}
        <path d="M110 145 Q140 160 145 135" fill="none" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" />
        <polygon points="145,135 158,125 150,142 162,136" fill="#f59e0b" filter="drop-shadow(0 0 6px #ea580c)" />

        {/* Head Horns & Feathers */}
        <polygon points="80,55 70,25 90,45" fill="#c2410c" />
        <polygon points="120,55 130,25 110,45" fill="#c2410c" />

        {/* Head */}
        <ellipse cx="100" cy="75" rx="38" ry="32" fill="url(#dragonBodyGrad)" stroke="#f97316" strokeWidth="2.5" />

        {/* Fiery Eyes */}
        <ellipse cx="85" cy="72" rx="10" ry="13" fill="#431407" />
        <circle cx="83" cy="69" r="4" fill="#fbbf24" />
        <circle cx="87" cy="77" r="1.5" fill="#ffffff" />

        <ellipse cx="115" cy="72" rx="10" ry="13" fill="#431407" />
        <circle cx="113" cy="69" r="4" fill="#fbbf24" />
        <circle cx="117" cy="77" r="1.5" fill="#ffffff" />

        {/* Cute Snout & Tiny Smoke Puff */}
        <ellipse cx="100" cy="86" rx="12" ry="7" fill="#c2410c" />
        <circle cx="96" cy="85" r="2" fill="#431407" />
        <circle cx="104" cy="85" r="2" fill="#431407" />
        <circle cx="108" cy="98" r="3" fill="#9ca3af" opacity="0.6" />

        {/* Chubby Belly */}
        <path d="M78 105 Q100 98 122 105 Q130 145 100 148 Q70 145 78 105 Z" fill="url(#dragonBodyGrad)" stroke="#f97316" strokeWidth="2" />
        <ellipse cx="100" cy="125" rx="14" ry="12" fill="#fb923c" />
      </svg>
    );
  }

  if (stage === 'juvenile') {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="dragonJuvGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#431407" />
          </radialGradient>
        </defs>

        {/* Fiery Spread Wings */}
        <path d="M70 85 Q20 30 15 85 Q45 110 70 100 Z" fill="#c2410c" stroke="#f97316" strokeWidth="2.5" />
        <path d="M130 85 Q180 30 185 85 Q155 110 130 100 Z" fill="#c2410c" stroke="#f97316" strokeWidth="2.5" />
        
        {/* Dragon Horns & Crest */}
        <polygon points="75,45 55,10 85,35" fill="#ea580c" />
        <polygon points="125,45 145,10 115,35" fill="#ea580c" />
        <polygon points="100,30 100,10 106,25" fill="#f59e0b" />

        {/* Head */}
        <polygon points="100,38 125,60 115,85 85,85 75,60" fill="url(#dragonJuvGrad)" stroke="#f97316" strokeWidth="2" />

        {/* Glowing Eyes */}
        <polygon points="82,62 90,58 92,66 84,68" fill="#fef08a" filter="drop-shadow(0 0 6px #f59e0b)" />
        <polygon points="118,62 110,58 108,66 116,68" fill="#fef08a" filter="drop-shadow(0 0 6px #f59e0b)" />

        {/* Torso & Magma Chestplate */}
        <path d="M80 90 L100 85 L120 90 L115 145 L100 155 L85 145 Z" fill="url(#dragonJuvGrad)" stroke="#f97316" strokeWidth="2" />
        <path d="M92 100 L100 95 L108 100 L104 125 L100 130 L96 125 Z" fill="#fef08a" filter="drop-shadow(0 0 8px #ea580c)" />
      </svg>
    );
  }

  // Awakened Stage
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id="phoenixCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#fde047" />
          <stop offset="70%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#450a0a" />
        </radialGradient>
      </defs>

      {/* Radiant Solar-Magma Ring */}
      <circle cx="100" cy="100" r="88" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="14 8 4 8" opacity="0.85" />

      {/* Majestic Phoenix Fire Wings */}
      <path d="M60 85 C10 15 5 110 50 140 C65 115 70 100 60 85 Z" fill="url(#phoenixCore)" stroke="#fef08a" strokeWidth="2" />
      <path d="M140 85 C190 15 195 110 150 140 C135 115 130 100 140 85 Z" fill="url(#phoenixCore)" stroke="#fef08a" strokeWidth="2" />

      {/* Grand Dragon Horns */}
      <path d="M75 50 Q45 10 30 18 Q60 38 75 50 Z" fill="#f97316" />
      <path d="M125 50 Q155 10 170 18 Q140 38 125 50 Z" fill="#f97316" />

      {/* Head */}
      <polygon points="100,30 128,62 118,92 82,92 72,62" fill="url(#phoenixCore)" stroke="#fef08a" strokeWidth="2" />

      {/* Blazing Eyes */}
      <ellipse cx="86" cy="65" rx="6" ry="8" fill="#ffffff" filter="drop-shadow(0 0 10px #f59e0b)" />
      <ellipse cx="114" cy="65" rx="6" ry="8" fill="#ffffff" filter="drop-shadow(0 0 10px #f59e0b)" />

      {/* Molten Heart Core */}
      <path d="M80 95 L100 88 L120 95 L112 155 L100 168 L88 155 Z" fill="#7c2d12" stroke="#ea580c" strokeWidth="2" />
      <polygon points="100,105 112,120 100,140 88,120" fill="#ffffff" filter="drop-shadow(0 0 16px #f97316)" />
    </svg>
  );
}

// 3. GOLDEN CELESTIAL WOLF RENDERER
function renderCelestialWolf(stage: CreatureStage, colors: any, crackLevel: number = 0) {
  if (stage === 'egg') {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="eggWolfGlow" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>
        </defs>

        {/* Orbiting Solar Corona */}
        <circle cx="100" cy="105" r="75" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="10 8" />
        <polygon points="100,20 104,26 100,24 96,26" fill="#fde047" />
        <polygon points="175,105 181,109 179,105 181,101" fill="#fde047" />

        {/* Egg Shell */}
        <path
          d="M100 28 C138 28 158 85 152 135 C146 172 125 182 100 182 C75 182 54 172 48 135 C42 85 62 28 100 28 Z"
          fill="url(#eggWolfGlow)"
          stroke="#ca8a04"
          strokeWidth="3.5"
        />

        {/* Celestial Lupus Constellation Markings */}
        <line x1="85" y1="70" x2="105" y2="85" stroke="#ffffff" strokeWidth="2" />
        <line x1="105" y1="85" x2="120" y2="75" stroke="#ffffff" strokeWidth="2" />
        <line x1="105" y1="85" x2="95" y2="115" stroke="#ffffff" strokeWidth="2" />
        <line x1="95" y1="115" x2="115" y2="135" stroke="#ffffff" strokeWidth="2" />
        <circle cx="85" cy="70" r="4" fill="#ffffff" filter="drop-shadow(0 0 6px #fde047)" />
        <circle cx="105" cy="85" r="4" fill="#ffffff" filter="drop-shadow(0 0 6px #fde047)" />
        <circle cx="120" cy="75" r="4" fill="#ffffff" filter="drop-shadow(0 0 6px #fde047)" />
        <circle cx="95" cy="115" r="4" fill="#ffffff" filter="drop-shadow(0 0 6px #fde047)" />
        <circle cx="115" cy="135" r="4" fill="#ffffff" filter="drop-shadow(0 0 6px #fde047)" />

        {/* Cracking Fissures */}
        {renderEggCracks(crackLevel)}
      </svg>
    );
  }

  if (stage === 'hatchling' || stage === 'baby') {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="wolfPupGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>
        </defs>

        {/* Fluffy Wolf Ears */}
        <polygon points="65,60 55,20 85,45" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
        <polygon points="66,55 60,30 80,48" fill="#fef08a" />
        
        <polygon points="135,60 145,20 115,45" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
        <polygon points="134,55 140,30 120,48" fill="#fef08a" />

        {/* Starlight Tail */}
        <path d="M125 135 Q155 140 160 115 Q145 110 130 125" fill="#facc15" />
        <circle cx="160" cy="115" r="5" fill="#ffffff" filter="drop-shadow(0 0 6px #eab308)" />

        {/* Head */}
        <ellipse cx="100" cy="75" rx="38" ry="32" fill="url(#wolfPupGrad)" stroke="#ca8a04" strokeWidth="2" />

        {/* Big Diamond Eyes */}
        <ellipse cx="85" cy="70" rx="9" ry="12" fill="#422006" />
        <circle cx="83" cy="67" r="3.5" fill="#ffffff" />
        <circle cx="87" cy="74" r="1.5" fill="#fde047" />

        <ellipse cx="115" cy="70" rx="9" ry="12" fill="#422006" />
        <circle cx="113" cy="67" r="3.5" fill="#ffffff" />
        <circle cx="117" cy="74" r="1.5" fill="#fde047" />

        {/* Cute Wolf Muzzle */}
        <ellipse cx="100" cy="85" rx="14" ry="10" fill="#fef9c3" />
        <polygon points="100,82 96,78 104,78" fill="#422006" />
        <path d="M96 85 Q100 89 104 85" fill="none" stroke="#422006" strokeWidth="2" strokeLinecap="round" />

        {/* Body & Glowing Paws */}
        <path d="M80 102 Q100 95 120 102 Q128 145 100 148 Q72 145 80 102 Z" fill="url(#wolfPupGrad)" stroke="#ca8a04" strokeWidth="2" />
        <ellipse cx="82" cy="146" rx="7" ry="5" fill="#fef08a" />
        <ellipse cx="118" cy="146" rx="7" ry="5" fill="#fef08a" />
      </svg>
    );
  }

  if (stage === 'juvenile') {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="wolfJuvGrad" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>
        </defs>

        {/* Solar Flare Mane */}
        <path d="M60 70 Q35 45 45 90 Q65 115 80 105 Z" fill="#eab308" stroke="#facc15" strokeWidth="1.5" />
        <path d="M140 70 Q165 45 155 90 Q135 115 120 105 Z" fill="#eab308" stroke="#facc15" strokeWidth="1.5" />

        {/* Noble Wolf Ears */}
        <polygon points="70,55 58,15 88,40" fill="#ca8a04" />
        <polygon points="130,55 142,15 112,40" fill="#ca8a04" />

        {/* Head */}
        <polygon points="100,40 126,65 116,92 84,92 74,65" fill="url(#wolfJuvGrad)" stroke="#facc15" strokeWidth="2" />

        {/* Solar Markings on Forehead */}
        <polygon points="100,48 104,56 100,62 96,56" fill="#ffffff" filter="drop-shadow(0 0 6px #eab308)" />

        {/* Radiant Eyes */}
        <polygon points="84,68 92,64 94,72 86,74" fill="#ffffff" filter="drop-shadow(0 0 6px #fde047)" />
        <polygon points="116,68 108,64 106,72 114,74" fill="#ffffff" filter="drop-shadow(0 0 6px #fde047)" />

        {/* Wolf Muzzle */}
        <polygon points="100,82 92,76 108,76" fill="#713f12" />

        {/* Stately Chest & Solar Crest */}
        <path d="M80 92 L100 86 L120 92 L115 148 L100 158 L85 148 Z" fill="url(#wolfJuvGrad)" stroke="#facc15" strokeWidth="2" />
        <polygon points="100,105 108,120 100,132 92,120" fill="#ffffff" filter="drop-shadow(0 0 10px #eab308)" />
      </svg>
    );
  }

  // Awakened Stage
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id="sunWolfApex" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#fef08a" />
          <stop offset="70%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#422006" />
        </radialGradient>
      </defs>

      {/* Celestial Solar Ring with Star Radiance */}
      <circle cx="100" cy="100" r="88" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="16 6 4 6" opacity="0.9" />

      {/* 8 Solar Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line
          key={i}
          x1="100"
          y1="10"
          x2="100"
          y2="2"
          stroke="#fde047"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${angle} 100 100)`}
          filter="drop-shadow(0 0 6px #eab308)"
        />
      ))}

      {/* Solar Mantle Auroras */}
      <path d="M50 75 Q15 25 30 115 Q65 145 80 115 Z" fill="url(#sunWolfApex)" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M150 75 Q185 25 170 115 Q135 145 120 115 Z" fill="url(#sunWolfApex)" stroke="#ffffff" strokeWidth="1.5" />

      {/* Grand Celestial Ears */}
      <polygon points="68,52 50,10 85,35" fill="#ca8a04" stroke="#ffffff" strokeWidth="1.5" />
      <polygon points="132,52 150,10 115,35" fill="#ca8a04" stroke="#ffffff" strokeWidth="1.5" />

      {/* Head */}
      <polygon points="100,32 130,62 118,95 82,95 70,62" fill="url(#sunWolfApex)" stroke="#ffffff" strokeWidth="2" />

      {/* Golden Eyes & Star Crown */}
      <polygon points="100,24 105,32 100,38 95,32" fill="#ffffff" filter="drop-shadow(0 0 10px #facc15)" />
      <ellipse cx="85" cy="65" rx="6" ry="8" fill="#ffffff" filter="drop-shadow(0 0 10px #facc15)" />
      <ellipse cx="115" cy="65" rx="6" ry="8" fill="#ffffff" filter="drop-shadow(0 0 10px #facc15)" />

      {/* Mythic Wolf Torso */}
      <path d="M80 95 L100 88 L120 95 L112 155 L100 168 L88 155 Z" fill="#713f12" stroke="#facc15" strokeWidth="2" />
      <polygon points="100,105 114,124 100,144 86,124" fill="#ffffff" filter="drop-shadow(0 0 18px #eab308)" />
    </svg>
  );
}
