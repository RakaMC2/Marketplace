import React from 'react';

export interface User {
  uid?: string;
  username: string;
  role: 'user' | 'staff' | 'admin' | 'owner';
  banned?: boolean;
  muted?: boolean;
  profilePic?: string;
  profileBorder?: string;
  customColor?: string;
  bio?: string;
  socials?: {
    discord?: string;
    whatsapp?: string;
    youtube?: string;
  };
}

export interface Rating {
  userId: string;
  username: string;
  rating: number;
  review?: string;
  timestamp: number;
}

export interface Changelog {
  version: string;
  text: string;
  timestamp: number;
}

export interface Item {
  id: string;
  title: string;
  desc: string;
  cat: string;
  link: string;
  youtube?: string;
  originalCreator?: string;
  img: string;
  gallery?: string[];
  changelog?: Changelog[];
  authorId: string;
  author: string;
  ratings?: Record<string, Rating>;
  featured?: boolean;
}

export interface CategoryState {
  [key: string]: string;
}

export const BORDERS: Record<
  string,
  { name: string; class: string; style?: React.CSSProperties }
> = {
  default: { name: 'Default', class: 'border-2 border-[#2d2d3a]' },
  custom: { name: 'CUSTOM 🎨', class: 'border-custom' },

  gold: {
    name: 'Gold',
    class: 'border-2 border-[#FFD700] shadow-[0_0_10px_#FFD700] animate-pulse',
  },

  fire: {
    name: 'Fire',
    class: 'border-2 border-orange-500 shadow-[0_0_15px_orange] animate-pulse',
  },

  diamond: {
    name: 'Diamond',
    class: 'border-2 border-[#b9f2ff] shadow-[0_0_10px_#b9f2ff] animate-glow',
  },

  ruby: {
    name: 'Ruby',
    class: 'border-2 border-[#e0115f] shadow-[0_0_12px_#e0115f] animate-pulse',
  },

  emerald: {
    name: 'Emerald',
    class: 'border-2 border-[#50c878] shadow-[0_0_12px_#50c878] animate-glow',
  },

  ice: {
    name: 'Ice',
    class: 'border-2 border-cyan-400 shadow-[0_0_20px_cyan] animate-flicker',
  },

  neon_purple: {
    name: 'Neon Purple',
    class: 'border-2 border-purple-500 shadow-[0_0_15px_#a855f7] animate-pulse',
  },

  neon_red: {
    name: 'Neon Red',
    class: 'border-2 border-[#ff0055] shadow-[0_0_15px_#ff0055] animate-pulse',
  },

  neon_green: {
    name: 'Neon Green',
    class: 'border-2 border-[#0f0] shadow-[0_0_15px_#0f0] animate-pulse',
  },

  galaxy: {
    name: 'Galaxy',
    class: 'animate-gradient-border',
  },

  glitch: {
    name: 'Glitch',
    class:
      'border-2 border-white shadow-[-2px_0_red,2px_0_blue] animate-glitch',
  },

  ghost: {
    name: 'Ghost',
    class:
      'border-2 border-white/20 hover:border-white/60 animate-fade transition-all',
  },

  lightning: {
    name: 'Lightning',
    class:
      'border-2 border-yellow-300 shadow-[0_0_20px_yellow] animate-flash',
  },

  toxic: {
    name: 'Toxic',
    class:
      'border-2 border-lime-400 shadow-[0_0_25px_lime] animate-wiggle',
  },

  cyber_blue: {
    name: 'Cyber Blue',
    class:
      'border-2 border-sky-400 shadow-[0_0_15px_#38bdf8] animate-scan',
  },

  magma: {
    name: 'Magma',
    class:
      'border-2 border-red-700 shadow-[0_0_20px_red] animate-flow',
  },

  plasma: {
    name: 'Plasma',
    class:
      'border-2 border-fuchsia-500 shadow-[0_0_25px_fuchsia] animate-spin-slow',
  },

  aurora: {
    name: 'Aurora',
    class: 'animate-aurora-border',
  },

  rainbow: {
    name: 'Rainbow',
    class: 'animate-rainbow-border',
  },

  void: {
    name: 'Void',
    class:
      'border-2 border-black shadow-[0_0_30px_purple] animate-pulse',
  },

  matrix: {
    name: 'Matrix',
    class:
      'border-2 border-green-500 shadow-[0_0_20px_green] animate-matrix',
  },

  hologram: {
    name: 'Hologram',
    class:
      'border-2 border-cyan-300 shadow-[0_0_20px_cyan] animate-holo',
  },

  inferno: {
    name: 'Inferno',
    class:
      'border-2 border-orange-600 shadow-[0_0_30px_orange] animate-flame',
  },

  frostbite: {
    name: 'Frostbite',
    class:
      'border-2 border-blue-300 shadow-[0_0_25px_#7dd3fc] animate-shiver',
  },

  pulse_wave: {
    name: 'Pulse Wave',
    class:
      'border-2 border-indigo-400 shadow-[0_0_20px_indigo] animate-wave',
  },

  cosmic_spin: {
    name: 'Cosmic Spin',
    class: 'animate-spin-border',
  },

  static_noise: {
    name: 'Static',
    class:
      'border-2 border-gray-300 shadow-[0_0_10px_white] animate-noise',
  },
  
  lightning_discord: {
    name: 'Lightning Discord ⚡',
    class: 'border-2 border-yellow-400 lightning-discord',
  },
};
