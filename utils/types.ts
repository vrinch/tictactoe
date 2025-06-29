import { ComponentType } from 'react';

// Info for each onboarding screen
export interface WalkthroughItem {
  key: string;
  title: string;
  description: string;
  Icon: ComponentType<{ size?: number }>;
}

// Allowed values for each square on the board
export type Player = 'X' | 'O' | null;

// 3x3 board as a flat array
export type GameBoard = Player[];

// Current state of a running game session
export interface GameState {
  board: GameBoard;
  currentPlayer: Player;
  winner: Player | 'tie' | null;
  gameOver: boolean;
  playerScore: number;
  aiScore: number;
  ties: number;
}

// One game's summary data for history/stats
export interface GameResult {
  id: string;
  username: string;
  result: 'win' | 'lose' | 'tie';
  date: string;
  moves: number;
  difficulty: string;
}

// Player profile info stored in the database
export interface UserProfile {
  userId: string;
  username: string;
  color: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
}

// Difficulty modes for AI
export type Difficulty = 'easy' | 'medium' | 'hard';

// All user preferences for gameplay/UX
export interface UserSettings {
  aiPlaysFirst: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  autoResetBoard: boolean;
  resetDelay: number;
}

// Board is always exactly 9 cells long
export type Board = [
  'X' | 'O' | null,
  'X' | 'O' | null,
  'X' | 'O' | null,
  'X' | 'O' | null,
  'X' | 'O' | null,
  'X' | 'O' | null,
  'X' | 'O' | null,
  'X' | 'O' | null,
  'X' | 'O' | null,
];
