import { WINNING_COMBINATIONS } from '../constants/arrays';
import { Board, Difficulty, GameBoard, Player } from './types';

// Create an empty 3x3 game board
export const createEmptyBoard = (): GameBoard => {
  return Array(9).fill(null);
};

// Check for a winner or tie
export const checkWinner = (board: GameBoard): Player | 'tie' | null => {
  // Check all winning patterns
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  // Check for tie
  if (board.every(cell => cell !== null)) {
    return 'tie';
  }

  return null;
};

// Get list of empty cell positions
export const getAvailableMoves = (board: GameBoard): number[] => {
  return board.reduce((moves: number[], cell, index) => {
    if (cell === null) moves.push(index);
    return moves;
  }, []);
};

// Make a move on the board immutably
export const makeMove = (
  board: GameBoard,
  position: number,
  player: Player,
): GameBoard => {
  if (board[position] !== null) return board;
  const newBoard = [...board];
  newBoard[position] = player;
  return newBoard;
};

// Minimax with alpha-beta pruning for optimal AI
const minimax = (
  board: GameBoard,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
): number => {
  const winner = checkWinner(board);

  if (winner === 'O') return 10 - depth; // AI wins
  if (winner === 'X') return depth - 10; // Player wins
  if (winner === 'tie') return 0; // Draw

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        const newBoard = makeMove(board, i, 'O');
        const score = minimax(newBoard, depth + 1, false, alpha, beta);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        const newBoard = makeMove(board, i, 'X');
        const score = minimax(newBoard, depth + 1, true, alpha, beta);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
    }
    return minScore;
  }
};

// Pick AI move based on difficulty setting
export const getAIMove = (board: GameBoard, difficulty: Difficulty): number => {
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) return -1;

  switch (difficulty) {
    case 'easy':
      // Random move
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];

    case 'medium':
      // Try to win or block, otherwise random
      for (const move of availableMoves) {
        const testBoard = makeMove(board, move, 'O');
        if (checkWinner(testBoard) === 'O') return move;
      }
      for (const move of availableMoves) {
        const testBoard = makeMove(board, move, 'X');
        if (checkWinner(testBoard) === 'X') return move;
      }
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];

    case 'hard':
      // Minimax for optimal play
      let bestMove = -1;
      let bestValue = -Infinity;

      for (const move of availableMoves) {
        const newBoard = makeMove(board, move, 'O');
        const moveValue = minimax(newBoard, 0, false, -Infinity, Infinity);
        if (moveValue > bestValue) {
          bestValue = moveValue;
          bestMove = move;
        }
      }
      return bestMove;

    default:
      return availableMoves[0];
  }
};

// Calculate win/loss stats from game history
export const calculateGameStats = (
  results: any[],
): { wins: number; losses: number; ties: number } => {
  return results.reduce(
    (stats, result) => {
      switch (result.result) {
        case 'win':
          stats.wins++;
          break;
        case 'lose':
          stats.losses++;
          break;
        case 'tie':
          stats.ties++;
          break;
      }
      return stats;
    },
    { wins: 0, losses: 0, ties: 0 },
  );
};

// Legacy hook compatibility functions
export const checkWin = (board: Board, player: Player): boolean => {
  return WINNING_COMBINATIONS.some(condition =>
    condition.every(index => board[index] === player),
  );
};

export const checkDraw = (board: Board): boolean => {
  return board.every(cell => cell !== null);
};

export const getRandomMove = (board: Board): number => {
  const emptyCells = board
    .map((cell, index) => (cell === null ? index : null))
    .filter(index => index !== null) as number[];
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
};

// Save board state and moves for replay
export const serializeBoardState = (
  board: GameBoard,
  moves: { player: Player; position: number }[],
): string => {
  return JSON.stringify({
    finalBoard: board,
    moves: moves,
    timestamp: new Date().toISOString(),
  });
};

// Load saved game state for viewing
export const deserializeBoardState = (
  serialized: string,
): {
  finalBoard: GameBoard;
  moves: { player: Player; position: number }[];
  timestamp: string;
} => {
  try {
    return JSON.parse(serialized);
  } catch (error) {
    return {
      finalBoard: createEmptyBoard(),
      moves: [],
      timestamp: new Date().toISOString(),
    };
  }
};

// Replay moves step-by-step to get board states
export const replayGame = (
  moves: { player: Player; position: number }[],
): GameBoard[] => {
  const boardStates: GameBoard[] = [createEmptyBoard()];
  let currentBoard = createEmptyBoard();

  for (const move of moves) {
    currentBoard = makeMove(currentBoard, move.position, move.player);
    boardStates.push([...currentBoard]);
  }

  return boardStates;
};
