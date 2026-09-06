import { CreatureArchetypeInfo, CreatureStage, CreatureType } from '../types';

export const CREATURE_ARCHETYPES: Record<CreatureType, CreatureArchetypeInfo> = {
  green_alien_cosmos: {
    type: 'green_alien_cosmos',
    name: 'Flora Xeno & Cosmic Sprout',
    title: 'Harbinger of Cosmic Knowledge & Deep Flow',
    element: 'Nature & Cosmos',
    themeColor: '#10b981', // emerald
    accentColor: '#34d399',
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-950',
    tagline: 'Deep Focus, Natural Harmony & Cosmic Intellect',
    description: 'Born from a bioluminescent interstellar seed drifting through tranquil stellar nebulae. Feeds on structured learning, deep contemplation, and scientific clarity.',
    philosophy: 'Steady growth like ancient roots reaching into star-dusted soil. Every small lesson blossoms into vast mastery.',
    lore: 'Discovered near the emerald aurora of Sector Andromeda. It resonates with minds that seek profound clarity, disciplined focus, and gentle daily consistency.',
    stages: {
      egg: {
        name: 'Cosmic Jade Egg',
        desc: 'A shimmering emerald egg pulsating with orbital stardust and verdant bio-rings.',
        minLevel: 1,
      },
      hatchling: {
        name: 'Sproutling Xeno',
        desc: 'A curious green hatchling with antennae that glow when you absorb knowledge.',
        minLevel: 2,
      },
      baby: {
        name: 'Sproutling Xeno',
        desc: 'A curious green hatchling with antennae that glow when you absorb knowledge.',
        minLevel: 2,
      },
      juvenile: {
        name: 'Astral Bio-Wanderer',
        desc: 'Levitates gracefully, creating micro-galaxies of emerald light as you complete tasks.',
        minLevel: 4,
      },
      awakened: {
        name: 'Galactic Arbiter of Cosmos',
        desc: 'An exalted cosmic entity with orbital rings, crystalline leaf-wings, and infinite wisdom.',
        minLevel: 8,
      },
    },
    perks: [
      '+15% Focus Timer efficiency bonus',
      'Cosmic Harmony: +5 bonus XP for journaling',
      'Deep Root: Streak freeze insurance every 7 days',
    ],
  },

  phoenix_dragon_lava: {
    type: 'phoenix_dragon_lava',
    name: 'Ignis Drakon & Volcanic Phoenix',
    title: 'Embodiment of Blazing Passion & Unstoppable Drive',
    element: 'Lava & Fire',
    themeColor: '#f97316', // orange / fiery
    accentColor: '#fb923c',
    bgGradient: 'from-orange-950 via-red-950 to-slate-950',
    tagline: 'High Energy, Fierce Ambition & Resilient Momentum',
    description: 'Forged in the molten core of a cosmic volcano. Rebirths stronger after every obstacle, converting fiery challenges into unstoppable momentum.',
    philosophy: 'Turn resistance into fuel. The hotter the fire, the purer the steel of your habits.',
    lore: 'Legends say this dragon nested inside molten comets. It thrives when you tackle hard priorities, step out of comfort zones, and ignite decisive action.',
    stages: {
      egg: {
        name: 'Obsidian Magma Egg',
        desc: 'A volcanic egg with radiant molten fractures that crackle with warm embers.',
        minLevel: 1,
      },
      hatchling: {
        name: 'Ember Drake Hatchling',
        desc: 'A feisty baby dragon that sneezes playful sparks when you conquer difficult tasks.',
        minLevel: 2,
      },
      baby: {
        name: 'Ember Drake Hatchling',
        desc: 'A feisty baby dragon that sneezes playful sparks when you conquer difficult tasks.',
        minLevel: 2,
      },
      juvenile: {
        name: 'Pyroclastic Wyrm',
        desc: 'Soars on wings of living flame, leaving blazing trails of triumph across your dashboard.',
        minLevel: 4,
      },
      awakened: {
        name: 'Eternal Sovereign Phoenix-Dragon',
        desc: 'A legendary master of fire and sky, cloaked in celestial magma and diamond flame plumage.',
        minLevel: 8,
      },
    },
    perks: [
      '+20% Stardust on High-Priority tasks',
      'Fury of the Drake: Double XP on milestone completions',
      'Phoenix Surge: Re-energizes companion energy upon task completion',
    ],
  },

  golden_celestial_wolf: {
    type: 'golden_celestial_wolf',
    name: 'Solaris Fenrir & Golden Wolf',
    title: 'Guardian of Unshakable Discipline & Solar Radiance',
    element: 'Celestial & Astral Light',
    themeColor: '#eab308', // gold / yellow
    accentColor: '#fde047',
    bgGradient: 'from-amber-950 via-yellow-950 to-slate-950',
    tagline: 'Loyal Guardian, Noble Fortitude & Golden Clarity',
    description: 'A divine astral lupine born from sun flares and ancient constellation paths. Inspires honorable routines, ironclad resilience, and courageous consistency.',
    philosophy: 'The sun rises without fail every dawn. Stand unwavering, lead yourself with honor, and illuminate your path.',
    lore: 'Hailing from the Solar Constellation of Lupus, this wolf bonds for eternity with ambitious seekers, howling with celestial pride at each milestone achieved.',
    stages: {
      egg: {
        name: 'Solar Starburst Egg',
        desc: 'A golden astral egg inscribed with solar runes and enveloped in gentle light coronas.',
        minLevel: 1,
      },
      hatchling: {
        name: 'Starlight Pup',
        desc: 'An adorable golden wolf pup with glowing stardust paws and a constellation-tail.',
        minLevel: 2,
      },
      baby: {
        name: 'Starlight Pup',
        desc: 'An adorable golden wolf pup with glowing stardust paws and a constellation-tail.',
        minLevel: 2,
      },
      juvenile: {
        name: 'Solar Howler',
        desc: 'A majestic astral wolf whose mane burns with golden solar light as your streak grows.',
        minLevel: 4,
      },
      awakened: {
        name: 'Celestial Emperor Wolf',
        desc: 'A supreme mythic apex guardian crowned with solar rings and radiant starry halos.',
        minLevel: 8,
      },
    },
    perks: [
      '+25% XP multiplier on daily active streaks',
      'Solar Radiance: Unlocks cosmic aura visual toggles',
      'Loyal Pack: Increases daily affinity gain by +50%',
    ],
  },
};

export const MOOD_DEFINITIONS = [
  {
    type: 'transcendent',
    label: 'Victorious & Peak',
    emoji: '👑',
    color: 'from-amber-500 to-yellow-400',
    border: 'border-amber-400',
    desc: 'Unstoppable momentum, breakthrough victory, deep satisfaction',
  },
  {
    type: 'energetic',
    label: 'High Energy',
    emoji: '⚡',
    color: 'from-orange-500 to-rose-400',
    border: 'border-orange-400',
    desc: 'Motivated, eager to move forward, brimming with stamina',
  },
  {
    type: 'peaceful',
    label: 'Calm & Flow',
    emoji: '🌿',
    color: 'from-emerald-500 to-teal-400',
    border: 'border-emerald-400',
    desc: 'Mindful, serene, effortless concentration, balanced pace',
  },
  {
    type: 'inspired',
    label: 'Creative Spark',
    emoji: '✨',
    color: 'from-cyan-500 to-blue-400',
    border: 'border-cyan-400',
    desc: 'Fresh ideas, visionary motivation, curious exploration',
  },
  {
    type: 'steady',
    label: 'Disciplined',
    emoji: '🛡️',
    color: 'from-indigo-500 to-slate-400',
    border: 'border-indigo-400',
    desc: 'Showed up, put in the reps, steady rhythm and habit built',
  },
  {
    type: 'reflective',
    label: 'Introspective',
    emoji: '🌌',
    color: 'from-purple-500 to-indigo-400',
    border: 'border-purple-400',
    desc: 'Pondering, evaluating choices, seeking deeper meaning',
  },
  {
    type: 'overwhelmed',
    label: 'Fatigued / Heavy',
    emoji: '🌧️',
    color: 'from-slate-500 to-zinc-400',
    border: 'border-slate-400',
    desc: 'Heavy cognitive load, low energy, needing gentleness and rest',
  },
  {
    type: 'anxious',
    label: 'Stuck / Friction',
    emoji: '🌪️',
    color: 'from-rose-500 to-pink-400',
    border: 'border-rose-400',
    desc: 'Encountered resistance, doubts, or difficult crossroads',
  },
] as const;

// Calculate Level and Stage from XP
export function calculateLevelData(xp: number) {
  // Level threshold curve
  const thresholds = [
    0,     // Lvl 1 (Egg)
    100,   // Lvl 2 (Hatchling)
    250,   // Lvl 3
    450,   // Lvl 4 (Juvenile)
    700,   // Lvl 5
    1000,  // Lvl 6
    1400,  // Lvl 7
    1900,  // Lvl 8 (Awakened)
    2500,  // Lvl 9
    3200,  // Lvl 10 (Mastery)
  ];

  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }

  let stage: CreatureStage = 'egg';
  if (level >= 8) {
    stage = 'awakened';
  } else if (level >= 4) {
    stage = 'juvenile';
  } else if (level >= 2) {
    stage = 'hatchling';
  } else {
    stage = 'egg';
  }

  const currentLevelFloor = thresholds[level - 1] || 0;
  const nextLevelThreshold = thresholds[level] || thresholds[thresholds.length - 1] + 1000;
  const xpInLevel = xp - currentLevelFloor;
  const xpNeeded = nextLevelThreshold - currentLevelFloor;
  const progressPercent = Math.min(Math.max((xpInLevel / xpNeeded) * 100, 0), 100);

  return {
    level,
    stage,
    currentLevelFloor,
    nextLevelThreshold,
    xpInLevel,
    xpNeeded,
    progressPercent,
  };
}
