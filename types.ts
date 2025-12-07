import { LucideIcon } from 'lucide-react';

export interface Movie {
  title: string;
  year: string;
  desc: string;
  emoji: string;
  reason?: string; // For AI recommendations
}

export interface Genre {
  name: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  desc: string;
}

export interface ExtraContent {
  type: 'quote' | 'trivia';
  text: string;
}

export type ViewState = 'home' | 'result';
