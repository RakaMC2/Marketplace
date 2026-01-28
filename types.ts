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

export const BORDERS: Record<string, { name: string; class: string; style?: React.CSSProperties }> = {
  'default': { name: 'Default', class: 'border-2 border-[#2d2d3a]' },
  'custom': { name: 'CUSTOM 🎨', class: 'border-custom' },
  'gold': { name: 'Gold', class: 'border-2 border-[#FFD700] shadow-[0_0_10px_#FFD700] animate-pulse' },
  'diamond': { name: 'Diamond', class: 'border-2 border-[#b9f2ff] shadow-[0_0_10px_#b9f2ff] bg-cyan-900/20' },
  'ruby': { name: 'Ruby', class: 'border-2 border-[#e0115f] shadow-[0_0_10px_#e0115f]' },
  'emerald': { name: 'Emerald', class: 'border-2 border-[#50c878] shadow-[0_0_10px_#50c878]' },
  'galaxy': { name: 'Galaxy', class: 'animate-gradient-border' },
  'fire': { name: 'Fire', class: 'border-2 border-orange-500 shadow-[0_0_15px_orange] animate-pulse' },
  'ice': { name: 'Ice', class: 'border-2 border-cyan-400 shadow-[0_0_15px_cyan]' },
  'neon_purple': { name: 'Neon Purple', class: 'border-2 border-purple-500 shadow-[0_0_10px_#a855f7]' },
  'neon_red': { name: 'Neon Red', class: 'border-2 border-[#ff0055] shadow-[0_0_10px_#ff0055]' },
  'neon_green': { name: 'Neon Green', class: 'border-2 border-[#0f0] shadow-[0_0_10px_#0f0]' },
  'glitch': { name: 'Glitch', class: 'border-2 border-white shadow-[-2px_0_red,2px_0_blue]' },
  'ghost': { name: 'Ghost', class: 'border-2 border-white/20 hover:border-white/50 transition-colors' },
};