import { Cup, Monument, Sword } from '@/components/svgicons';
import { WalkthroughItem } from '@/utils/types';

// Color palette for user profiles, organized by family
export const USERNAME_COLORS = [
  // Reds & Pinks
  '#E91E63', // Pink
  '#DA1830', // Primary Red
  '#F44336', // Material Red
  '#D81B60', // Deep Pink
  '#FF5722', // Deep Orange

  // Purples & Violets
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#7B1FA2', // Vivid Purple
  '#3F51B5', // Indigo
  '#AD1457', // Deep Magenta

  // Blues
  '#2196F3', // Material Blue
  '#0288D1', // Dark Cyan
  '#1976D2', // Primary Blue
  '#0277BD', // Light Blue
  '#455A64', // Blue Gray

  // Greens & Teals
  '#4CAF50', // Material Green
  '#2E7D32', // Forest Green
  '#00695C', // Teal
  '#388E3C', // Green

  // Earth tones
  '#5D4037', // Brown
  '#6D4C41', // Dark Brown
];

// Onboarding steps for the walkthrough carousel
export const WALKTHROUGH_DATA: WalkthroughItem[] = [
  {
    key: '1',
    title: 'Welcome',
    description:
      "One of the world's oldest and most beloved games is now available on your smartphone with modern design!",
    Icon: Monument,
  },
  {
    key: '2',
    title: 'Challenge Smart AI',
    description:
      "Face off against intelligent AI opponents, sharpen your strategic moves, and prove you're a worthy challenger!",
    Icon: Sword,
  },
  {
    key: '3',
    title: 'Track Your Progress',
    description:
      'Win games, improve your strategy, and become a Tic Tac Toe master!',
    Icon: Cup,
  },
];

// All possible ways to win in tic-tac-toe
export const WINNING_COMBINATIONS = [
  // Rows
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row

  // Columns
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column

  // Diagonals
  [0, 4, 8], // Top-left to bottom-right
  [2, 4, 6], // Top-right to bottom-left
];

// Game difficulty options with AI behavior descriptions
export const GAME_DIFFICULTIES = [
  {
    id: 'easy' as const,
    name: 'Easy',
    description: 'Random moves - perfect for beginners',
  },
  {
    id: 'medium' as const,
    name: 'Medium',
    description: 'Smart moves - tries to win and block',
  },
  {
    id: 'hard' as const,
    name: 'Hard',
    description: 'Unbeatable AI - uses minimax algorithm',
  },
] as const;

// Possible game outcomes
export const GAME_RESULTS = ['win', 'lose', 'tie'] as const;

// Available sound effects
export const SOUND_TYPES = ['click', 'win', 'lose'] as const;

// Returns 'dark' for bright backgrounds, 'light' for dark ones
export const getContrastTextColor = (
  backgroundColor: string,
): 'light' | 'dark' => {
  const hex = backgroundColor.replace('#', '');

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate brightness using standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'dark' : 'light';
};

// Pick a random color for new profiles
export const getRandomUsernameColor = (): string => {
  const randomIndex = Math.floor(Math.random() * USERNAME_COLORS.length);
  return USERNAME_COLORS[randomIndex];
};

// Check if a color is in our approved list
export const isValidUsernameColor = (color: string): boolean => {
  return USERNAME_COLORS.includes(color);
};

// Find where this color appears in the username colors list
export const getColorIndex = (color: string): number => {
  return USERNAME_COLORS.indexOf(color);
};

// Color groups for organized display
export const COLOR_GROUPS = {
  warm: USERNAME_COLORS.slice(0, 5), // Reds & Pinks
  cool: USERNAME_COLORS.slice(5, 10), // Purples & Violets
  blue: USERNAME_COLORS.slice(10, 15), // Blues
  nature: USERNAME_COLORS.slice(15, 19), // Greens & Teals
  earth: USERNAME_COLORS.slice(19, 21), // Browns
} as const;

// Nice color pairings for themes
export const COLOR_COMBINATIONS = [
  { primary: '#DA1830', secondary: '#2196F3' }, // Red & Blue
  { primary: '#4CAF50', secondary: '#9C27B0' }, // Green & Purple
  { primary: '#FF5722', secondary: '#0288D1' }, // Orange & Cyan
  { primary: '#E91E63', secondary: '#00695C' }, // Pink & Teal
] as const;

// Auto-reset delay options in milliseconds
export const DELAYS = [1000, 2000, 3000, 5000, 10000];

// Human-readable delay labels
export const DELAY_LABELS = ['1s', '2s', '3s', '5s', '10s'];
