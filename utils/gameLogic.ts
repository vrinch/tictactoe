import { BOARD_SIZE } from '@/constants/config';
import { Board, Difficulty, GameBoard, Player } from './types';

// Set up board size limits - minimum matches our config, maximum is 20x20
const DEFAULT_BOARD_SIZE = BOARD_SIZE;
const MIN_BOARD_SIZE = BOARD_SIZE;
const MAX_BOARD_SIZE = 20;

// Smart cache that remembers recently used items and forgets old ones
class LRUCache<K, V> {
  private capacity: number;
  private cache = new Map<K, V>();
  private usage = new Set<K>();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move this item to the end - it's now the most recently used
      this.usage.delete(key);
      this.usage.add(key);
      return this.cache.get(key);
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Item already exists - just update it and mark as recently used
      this.usage.delete(key);
      this.usage.add(key);
      this.cache.set(key, value);
      return;
    }

    // Check if we need to make room for new item
    if (this.cache.size >= this.capacity) {
      // Remove the oldest item (first in usage set)
      const lru = this.usage.values().next().value;
      this.usage.delete(lru);
      this.cache.delete(lru);
    }

    // Add the new item
    this.cache.set(key, value);
    this.usage.add(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.usage.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  getHitRate(): number {
    return this.hits / (this.hits + this.misses || 1);
  }

  private hits = 0;
  private misses = 0;

  // Version of get() that tracks how often we find vs miss items
  getWithStats(key: K): V | undefined {
    const result = this.get(key);
    if (result !== undefined) {
      this.hits++;
    } else {
      this.misses++;
    }
    return result;
  }
}

// Calculate win/loss scores based on board size - bigger boards need bigger scores
const getDynamicScores = (size: number) => {
  const baseScore = size * size * 10; // 10x multiplier for breathing room
  return {
    WIN_SCORE: baseScore,
    LOSS_SCORE: -baseScore,
    TIE_SCORE: 0,
  };
};

// All the AI's decision-making parameters in one place
const AI_CONFIG = {
  // How much the AI values different board positions
  CENTER_BONUS: 30,
  CORNER_BONUS: 20,
  EDGE_BONUS: 10,

  // How the AI evaluates potential winning lines
  LINE_SCORE_BASE: 10,
  FORK_BONUS: 50, // Creating multiple winning threats
  BLOCK_BONUS: 40, // Blocking opponent's winning threats

  // How long the AI can think about its move
  TIME_LIMIT_MS: 1000,
  MIN_SEARCH_DEPTH: 1,
  MAX_SEARCH_DEPTH: 12,

  // Memory limits for different board sizes
  CACHE_SIZE: {
    SMALL_BOARD: 15000,
    MEDIUM_BOARD: 8000,
    LARGE_BOARD: 2000,
  },

  // When to switch strategies
  LARGE_BOARD_THRESHOLD: 7,
  ENDGAME_THRESHOLD: 8,

  // How much randomness to add to easy/medium AI
  EASY_SMART_PERCENTAGE: 0.25,
  MEDIUM_RANDOM_PERCENTAGE: 0.15,
} as const;

// How deep the AI can think for different board sizes
const PERFORMANCE_CONFIG = {
  MAX_MINIMAX_DEPTH: {
    3: 9, // 3x3 can search complete game tree
    4: 7, // 4x4 needs depth limiting
    5: 5, // 5x5 requires shallow search
    6: 4, // 6x6 very limited
    7: 3, // 7x7 minimal depth
    8: 2, // 8x8+ barely thinks ahead
    9: 2,
    10: 2,
  },
  ENABLE_TRANSPOSITION_TABLE: true, // Remember positions we've seen before
  ENABLE_ITERATIVE_DEEPENING: true, // Gradually think deeper
  ENABLE_MOVE_ORDERING: true, // Try best moves first
} as const;

// Choose cache size based on board size - smaller boards can afford bigger caches
const getCacheSize = (size: number): number => {
  if (size <= DEFAULT_BOARD_SIZE) return AI_CONFIG.CACHE_SIZE.SMALL_BOARD;
  if (size <= 6) return AI_CONFIG.CACHE_SIZE.MEDIUM_BOARD;
  return AI_CONFIG.CACHE_SIZE.LARGE_BOARD;
};

// Global caches that remember winning patterns and board evaluations
const winningCombinationsCache = new Map<number, number[][]>();
let boardEvaluationCache: LRUCache<string, number>;
let transpositionTable: LRUCache<
  string,
  { score: number; depth: number; flag: 'exact' | 'upper' | 'lower' }
>;

// Set up caches for the given board size
const initializeCaches = (size: number = DEFAULT_BOARD_SIZE) => {
  const cacheSize = getCacheSize(size);
  boardEvaluationCache = new LRUCache<string, number>(cacheSize);
  transpositionTable = new LRUCache<
    string,
    { score: number; depth: number; flag: 'exact' | 'upper' | 'lower' }
  >(cacheSize);
};

// Start with default size
initializeCaches();

// Make sure inputs are valid before using them
const validateBoardSize = (size: number): void => {
  if (
    !Number.isInteger(size) ||
    size < MIN_BOARD_SIZE ||
    size > MAX_BOARD_SIZE
  ) {
    throw new Error(
      `Invalid board size: ${size}. Must be an integer between ${MIN_BOARD_SIZE} and ${MAX_BOARD_SIZE}.`,
    );
  }
};

const validatePosition = (position: number, boardSize: number): void => {
  const maxPosition = boardSize * boardSize - 1;
  if (!Number.isInteger(position) || position < 0 || position > maxPosition) {
    throw new Error(
      `Invalid position: ${position}. Must be between 0 and ${maxPosition} for a ${boardSize}x${boardSize} board.`,
    );
  }
};

const validatePlayer = (player: Player): void => {
  if (player !== 'X' && player !== 'O') {
    throw new Error(`Invalid player: ${player}. Must be 'X' or 'O'.`);
  }
};

// Different directions to check for winning lines
const DIRECTION_VECTORS = [
  [1, 0], // horizontal (right)
  [0, 1], // vertical (down)
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
] as const;

// Check if there's a winning line starting from a position in a given direction
const checkLineFromPosition = (
  board: GameBoard,
  startRow: number,
  startCol: number,
  dx: number,
  dy: number,
  size: number,
): Player | null => {
  const startPos = startRow * size + startCol;
  const player = board[startPos];

  if (!player) return null;

  // Make sure the line fits within the board
  const endRow = startRow + (size - 1) * dx;
  const endCol = startCol + (size - 1) * dy;

  if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) {
    return null;
  }

  // Check every position in the line
  for (let i = 0; i < size; i++) {
    const row = startRow + i * dx;
    const col = startCol + i * dy;
    const pos = row * size + col;

    if (board[pos] !== player) {
      return null; // Found a different player or empty space
    }
  }

  return player;
};

// Check for winners using direction vectors (efficient for large boards)
const checkWinnerDynamic = (board: GameBoard, size: number): Player | null => {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      for (const [dx, dy] of DIRECTION_VECTORS) {
        const winner = checkLineFromPosition(board, row, col, dx, dy, size);
        if (winner) {
          return winner;
        }
      }
    }
  }
  return null;
};

// Generate all possible winning combinations for a board size
export const getWinningCombinations = (size: number): number[][] => {
  validateBoardSize(size);

  if (winningCombinationsCache.has(size)) {
    return winningCombinationsCache.get(size)!;
  }

  const combinations: number[][] = [];

  // Add all rows as winning combinations
  for (let row = 0; row < size; row++) {
    const rowCombination: number[] = [];
    for (let col = 0; col < size; col++) {
      rowCombination.push(row * size + col);
    }
    combinations.push(rowCombination);
  }

  // Add all columns as winning combinations
  for (let col = 0; col < size; col++) {
    const colCombination: number[] = [];
    for (let row = 0; row < size; row++) {
      colCombination.push(row * size + col);
    }
    combinations.push(colCombination);
  }

  // Add main diagonal (top-left to bottom-right)
  const mainDiagonal: number[] = [];
  for (let i = 0; i < size; i++) {
    mainDiagonal.push(i * size + i);
  }
  combinations.push(mainDiagonal);

  // Add anti-diagonal (top-right to bottom-left)
  const antiDiagonal: number[] = [];
  for (let i = 0; i < size; i++) {
    antiDiagonal.push(i * size + (size - 1 - i));
  }
  combinations.push(antiDiagonal);

  winningCombinationsCache.set(size, combinations);
  return combinations;
};

// Create a new empty board filled with nulls
export const createEmptyBoard = (
  size: number = DEFAULT_BOARD_SIZE,
): GameBoard => {
  validateBoardSize(size);
  const cellCount = size * size;
  return Array(cellCount).fill(null);
};

// Check who won the game, or if it's a tie
export const checkWinner = (
  board: GameBoard,
  size: number = DEFAULT_BOARD_SIZE,
): Player | 'tie' | null => {
  validateBoardSize(size);

  if (board.length !== size * size) {
    throw new Error(
      `Board size mismatch: expected ${size * size} cells, got ${board.length}`,
    );
  }

  let winner: Player | null;

  // Use dynamic checking for large boards (faster)
  if (size > 5) {
    winner = checkWinnerDynamic(board, size);
  } else {
    // Use pre-computed combinations for small boards
    const winningCombinations = getWinningCombinations(size);
    winner = null;

    for (const combination of winningCombinations) {
      const firstCell = board[combination[0]];
      if (firstCell && combination.every(index => board[index] === firstCell)) {
        winner = firstCell;
        break;
      }
    }
  }

  if (winner) return winner;

  // Check if board is full (tie game)
  if (board.every(cell => cell !== null)) {
    return 'tie';
  }

  return null;
};

// Find all empty positions where a player can move
export const getAvailableMoves = (board: GameBoard): number[] => {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
};

// Make a move on the board and return the new board state
export const makeMove = (
  board: GameBoard,
  position: number,
  player: Player,
): GameBoard => {
  const size = Math.sqrt(board.length);
  validateBoardSize(size);
  validatePosition(position, size);
  validatePlayer(player);

  if (board[position] !== null) {
    throw new Error(
      `Invalid move: position ${position} is already occupied by '${board[position]}'`,
    );
  }

  const newBoard = [...board];
  newBoard[position] = player;
  return newBoard;
};

// Create a unique hash for a board state (for caching)
const createBoardHash = (
  board: GameBoard,
  depth: number,
  isMaximizing: boolean,
  alpha?: number,
  beta?: number,
): string => {
  const boardStr = board.map(cell => cell || '-').join('');
  return `${boardStr}_${depth}_${isMaximizing}_${alpha}_${beta}`;
};

// Get strategically important positions for a given board size
const getStrategicPositions = (size: number) => {
  const positions = {
    center: [] as number[],
    corners: [] as number[],
    edges: [] as number[],
  };

  const mid = Math.floor(size / 2);

  // Find center positions
  if (size % 2 === 1) {
    // Odd size - single center
    positions.center.push(mid * size + mid);
  } else {
    // Even size - four center positions
    positions.center.push(
      (mid - 1) * size + (mid - 1),
      (mid - 1) * size + mid,
      mid * size + (mid - 1),
      mid * size + mid,
    );
  }

  // Find corner positions
  positions.corners = [0, size - 1, size * (size - 1), size * size - 1];

  // Find edge positions (excluding corners)
  for (let i = 1; i < size - 1; i++) {
    positions.edges.push(i); // Top edge
    positions.edges.push(i * size); // Left edge
    positions.edges.push((size - 1) * size + i); // Bottom edge
    positions.edges.push(i * size + (size - 1)); // Right edge
  }

  return positions;
};

// Evaluate how good a potential winning line is
const evaluateLine = (
  board: GameBoard,
  combination: number[],
  maximizingPlayer: Player,
  size: number,
): number => {
  let maxCount = 0;
  let minCount = 0;
  let empty = 0;

  const minimizingPlayer = maximizingPlayer === 'O' ? 'X' : 'O';

  for (const index of combination) {
    if (board[index] === maximizingPlayer) {
      maxCount++;
    } else if (board[index] === minimizingPlayer) {
      minCount++;
    } else {
      empty++;
    }
  }

  // If both players have pieces in this line, it's blocked
  if (maxCount > 0 && minCount > 0) return 0;

  // Score based on how many pieces we have
  if (maxCount > 0) {
    let score = Math.pow(AI_CONFIG.LINE_SCORE_BASE, maxCount);
    if (maxCount === size - 1) {
      score += AI_CONFIG.FORK_BONUS; // Almost winning
    }
    return score;
  }

  if (minCount > 0) {
    let score = -Math.pow(AI_CONFIG.LINE_SCORE_BASE, minCount);
    if (minCount === size - 1) {
      score -= AI_CONFIG.BLOCK_BONUS; // Need to block
    }
    return score;
  }

  return 0;
};

// Look for fork opportunities (multiple winning threats)
const detectForks = (
  board: GameBoard,
  player: Player,
  size: number,
): number => {
  const availableMoves = getAvailableMoves(board);
  let forkScore = 0;

  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, player);
    const winningCombinations = getWinningCombinations(size);
    let threats = 0;

    for (const combination of winningCombinations) {
      if (!combination.includes(move)) continue;

      let playerCount = 0;
      let emptyCount = 0;

      for (const index of combination) {
        if (testBoard[index] === player) {
          playerCount++;
        } else if (testBoard[index] === null) {
          emptyCount++;
        }
      }

      // This move creates a winning threat
      if (playerCount === size - 1 && emptyCount === 1) {
        threats++;
      }
    }

    // Fork = multiple threats from one move
    if (threats >= 2) {
      forkScore += AI_CONFIG.FORK_BONUS * threats;
    }
  }

  return forkScore;
};

// Evaluate how good a board position is overall
const evaluateBoard = (
  board: GameBoard,
  size: number,
  maximizingPlayer: Player = 'O',
): number => {
  const boardHash = createBoardHash(board, 0, true);

  // Check if we've already evaluated this position
  const cached = boardEvaluationCache.getWithStats(boardHash);
  if (cached !== undefined) {
    return cached;
  }

  const winner = checkWinner(board, size);
  const scores = getDynamicScores(size);

  // Handle game-ending positions
  if (winner === maximizingPlayer) {
    boardEvaluationCache.set(boardHash, scores.WIN_SCORE);
    return scores.WIN_SCORE;
  }
  if (winner === (maximizingPlayer === 'O' ? 'X' : 'O')) {
    boardEvaluationCache.set(boardHash, scores.LOSS_SCORE);
    return scores.LOSS_SCORE;
  }
  if (winner === 'tie') {
    boardEvaluationCache.set(boardHash, scores.TIE_SCORE);
    return scores.TIE_SCORE;
  }

  let score = 0;
  const winningCombinations = getWinningCombinations(size);
  const strategicPositions = getStrategicPositions(size);

  // Score all possible winning lines
  for (const combination of winningCombinations) {
    score += evaluateLine(board, combination, maximizingPlayer, size);
  }

  // Give bonus points for controlling strategic positions
  for (const pos of strategicPositions.center) {
    if (board[pos] === maximizingPlayer) score += AI_CONFIG.CENTER_BONUS;
    if (board[pos] === (maximizingPlayer === 'O' ? 'X' : 'O'))
      score -= AI_CONFIG.CENTER_BONUS;
  }

  for (const pos of strategicPositions.corners) {
    if (board[pos] === maximizingPlayer) score += AI_CONFIG.CORNER_BONUS;
    if (board[pos] === (maximizingPlayer === 'O' ? 'X' : 'O'))
      score -= AI_CONFIG.CORNER_BONUS;
  }

  for (const pos of strategicPositions.edges) {
    if (board[pos] === maximizingPlayer) score += AI_CONFIG.EDGE_BONUS;
    if (board[pos] === (maximizingPlayer === 'O' ? 'X' : 'O'))
      score -= AI_CONFIG.EDGE_BONUS;
  }

  // Look for fork opportunities on larger boards
  if (size >= 4) {
    score += detectForks(board, maximizingPlayer, size);
    score -= detectForks(board, maximizingPlayer === 'O' ? 'X' : 'O', size);
  }

  boardEvaluationCache.set(boardHash, score);
  return score;
};

// Calculate how good a move is for ordering purposes
const getAdvancedMovePriority = (
  position: number,
  board: GameBoard,
  size: number,
  player: Player,
): number => {
  let priority = 0;
  const strategicPositions = getStrategicPositions(size);

  // Give base priority based on position type
  if (strategicPositions.center.includes(position)) {
    priority += AI_CONFIG.CENTER_BONUS;
  } else if (strategicPositions.corners.includes(position)) {
    priority += AI_CONFIG.CORNER_BONUS;
  } else if (strategicPositions.edges.includes(position)) {
    priority += AI_CONFIG.EDGE_BONUS;
  }

  // Check if this move creates threats or blocks opponent
  const testBoard = makeMove(board, position, player);
  const winningCombinations = getWinningCombinations(size);
  let threats = 0;
  let blocks = 0;

  for (const combination of winningCombinations) {
    if (!combination.includes(position)) continue;

    let playerCount = 0;
    let opponentCount = 0;
    let emptyCount = 0;

    for (const index of combination) {
      if (testBoard[index] === player) {
        playerCount++;
      } else if (testBoard[index] === (player === 'O' ? 'X' : 'O')) {
        opponentCount++;
      } else {
        emptyCount++;
      }
    }

    if (playerCount === size) {
      priority += 10000; // Winning move
    } else if (playerCount === size - 1 && emptyCount === 1) {
      threats++;
    } else if (opponentCount === size - 1 && emptyCount === 1) {
      blocks++;
    }
  }

  priority += threats * AI_CONFIG.FORK_BONUS;
  priority += blocks * AI_CONFIG.BLOCK_BONUS;
  return priority;
};

// Sort moves by priority to improve search efficiency
const orderMoves = (
  availableMoves: number[],
  board: GameBoard,
  size: number,
  player: Player,
): number[] => {
  if (!PERFORMANCE_CONFIG.ENABLE_MOVE_ORDERING) {
    return availableMoves;
  }

  return availableMoves.sort((a, b) => {
    const priorityA = getAdvancedMovePriority(a, board, size, player);
    const priorityB = getAdvancedMovePriority(b, board, size, player);
    return priorityB - priorityA; // Higher priority first
  });
};

// The main AI thinking algorithm - minimax with alpha-beta pruning
const minimax = (
  board: GameBoard,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  size: number,
  maximizingPlayer: Player = 'O',
  maxDepth?: number,
  startTime?: number,
): { score: number; bestMove?: number } => {
  // Stop thinking if we're taking too long
  if (startTime && Date.now() - startTime > AI_CONFIG.TIME_LIMIT_MS) {
    return { score: evaluateBoard(board, size, maximizingPlayer) };
  }

  const depthLimit =
    maxDepth ??
    PERFORMANCE_CONFIG.MAX_MINIMAX_DEPTH[
      size as keyof typeof PERFORMANCE_CONFIG.MAX_MINIMAX_DEPTH
    ] ??
    4;
  const scores = getDynamicScores(size);

  // Check if we've seen this position before
  const boardHash = createBoardHash(board, depth, isMaximizing, alpha, beta);
  if (PERFORMANCE_CONFIG.ENABLE_TRANSPOSITION_TABLE) {
    const cached = transpositionTable.get(boardHash);
    if (cached && cached.depth >= depth) {
      if (cached.flag === 'exact') {
        return { score: cached.score };
      } else if (cached.flag === 'lower' && cached.score >= beta) {
        return { score: cached.score };
      } else if (cached.flag === 'upper' && cached.score <= alpha) {
        return { score: cached.score };
      }
    }
  }

  // Check if the game is over
  const winner = checkWinner(board, size);
  if (winner === maximizingPlayer) {
    const score = scores.WIN_SCORE - depth; // Prefer quicker wins
    return { score };
  }
  if (winner === (maximizingPlayer === 'O' ? 'X' : 'O')) {
    const score = scores.LOSS_SCORE + depth; // Prefer slower losses
    return { score };
  }
  if (winner === 'tie') {
    return { score: scores.TIE_SCORE };
  }

  // Stop searching if we've reached our depth limit
  if (depth >= depthLimit) {
    const score = evaluateBoard(board, size, maximizingPlayer);
    return { score };
  }

  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) {
    return { score: scores.TIE_SCORE };
  }

  let bestMove: number | undefined;
  let bestScore: number;
  let flag: 'exact' | 'upper' | 'lower' = 'exact';

  if (isMaximizing) {
    // AI's turn - try to maximize score
    bestScore = -Infinity;
    const orderedMoves = orderMoves(
      availableMoves,
      board,
      size,
      maximizingPlayer,
    );

    for (const move of orderedMoves) {
      const newBoard = makeMove(board, move, maximizingPlayer);
      const result = minimax(
        newBoard,
        depth + 1,
        false,
        alpha,
        beta,
        size,
        maximizingPlayer,
        maxDepth,
        startTime,
      );

      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = move;
      }

      alpha = Math.max(alpha, result.score);

      // Alpha-beta pruning - we can stop searching
      if (beta <= alpha) {
        flag = 'lower';
        break;
      }
    }
  } else {
    // Opponent's turn - try to minimize score
    bestScore = Infinity;
    const minimizingPlayer = maximizingPlayer === 'O' ? 'X' : 'O';
    const orderedMoves = orderMoves(
      availableMoves,
      board,
      size,
      minimizingPlayer,
    );

    for (const move of orderedMoves) {
      const newBoard = makeMove(board, move, minimizingPlayer);
      const result = minimax(
        newBoard,
        depth + 1,
        true,
        alpha,
        beta,
        size,
        maximizingPlayer,
        maxDepth,
        startTime,
      );

      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }

      beta = Math.min(beta, result.score);

      // Alpha-beta pruning
      if (beta <= alpha) {
        flag = 'upper';
        break;
      }
    }
  }

  // Remember this position for future reference
  if (PERFORMANCE_CONFIG.ENABLE_TRANSPOSITION_TABLE) {
    transpositionTable.set(boardHash, { score: bestScore, depth, flag });
  }

  return { score: bestScore, bestMove };
};

// Gradually increase search depth until time runs out
const iterativeDeepening = (
  board: GameBoard,
  availableMoves: number[],
  size: number,
  timeLimit: number = AI_CONFIG.TIME_LIMIT_MS,
): number => {
  const startTime = Date.now();
  let bestMove = availableMoves[0];
  let depth = AI_CONFIG.MIN_SEARCH_DEPTH;
  const scores = getDynamicScores(size);

  if (boardEvaluationCache.size === 0) {
    initializeCaches(size);
  }

  while (
    Date.now() - startTime < timeLimit &&
    depth <= AI_CONFIG.MAX_SEARCH_DEPTH
  ) {
    try {
      const result = minimax(
        board,
        0,
        true,
        -Infinity,
        Infinity,
        size,
        'O',
        depth,
        startTime,
      );

      if (result.bestMove !== undefined) {
        bestMove = result.bestMove;
      }

      // Found a winning move - no need to search deeper
      if (result.score >= scores.WIN_SCORE - depth) {
        break;
      }

      depth++;
    } catch (error) {
      break;
    }
  }

  return bestMove;
};

// Easy AI - mostly random with occasional smart moves
const getEasyMove = (
  board: GameBoard,
  availableMoves: number[],
  size: number,
): number => {
  if (Math.random() < AI_CONFIG.EASY_SMART_PERCENTAGE) {
    return getMediumMove(board, availableMoves, size);
  }

  const strategicPositions = getStrategicPositions(size);
  const goodMoves = availableMoves.filter(
    move =>
      strategicPositions.center.includes(move) ||
      strategicPositions.corners.includes(move),
  );

  if (goodMoves.length > 0 && Math.random() < 0.3) {
    return goodMoves[Math.floor(Math.random() * goodMoves.length)];
  }

  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
};

// Medium AI - strategic play with some randomness
const getMediumMove = (
  board: GameBoard,
  availableMoves: number[],
  size: number,
): number => {
  // Always take a winning move
  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, 'O');
    if (checkWinner(testBoard, size) === 'O') {
      return move;
    }
  }

  // Always block opponent's winning move
  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, 'X');
    if (checkWinner(testBoard, size) === 'X') {
      return move;
    }
  }

  // Look for fork opportunities on larger boards
  if (size >= 4) {
    for (const move of availableMoves) {
      const testBoard = makeMove(board, move, 'O');
      const forkScore = detectForks(testBoard, 'O', size);
      if (forkScore > AI_CONFIG.FORK_BONUS) {
        return move;
      }
    }

    for (const move of availableMoves) {
      const testBoard = makeMove(board, move, 'X');
      const forkScore = detectForks(testBoard, 'X', size);
      if (forkScore > AI_CONFIG.FORK_BONUS) {
        return move;
      }
    }
  }

  // Prefer strategic positions
  const strategicPositions = getStrategicPositions(size);

  for (const center of strategicPositions.center) {
    if (availableMoves.includes(center)) {
      return center;
    }
  }

  for (const corner of strategicPositions.corners) {
    if (availableMoves.includes(corner)) {
      return corner;
    }
  }

  // Add some randomness to avoid being too predictable
  if (Math.random() < AI_CONFIG.MEDIUM_RANDOM_PERCENTAGE) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Choose the move with the best evaluation
  let bestMove = availableMoves[0];
  let bestScore = -Infinity;

  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, 'O');
    const score = evaluateBoard(testBoard, size, 'O');
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};

// Hard AI - uses full minimax search
const getHardMove = (
  board: GameBoard,
  availableMoves: number[],
  size: number,
): number => {
  // Always take an immediate win
  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, 'O');
    if (checkWinner(testBoard, size) === 'O') {
      return move;
    }
  }

  // Fall back to medium AI for very large boards
  if (size > AI_CONFIG.LARGE_BOARD_THRESHOLD) {
    console.log(
      `Board size ${size}x${size} too large for optimal AI - using strategic play`,
    );
    return getMediumMove(board, availableMoves, size);
  }

  const moveCount = board.filter(cell => cell !== null).length;
  const totalCells = size * size;
  const remainingMoves = totalCells - moveCount;

  // In endgame, search all remaining moves
  if (remainingMoves <= AI_CONFIG.ENDGAME_THRESHOLD) {
    const result = minimax(
      board,
      0,
      true,
      -Infinity,
      Infinity,
      size,
      'O',
      remainingMoves,
    );
    return result.bestMove ?? availableMoves[0];
  }

  // Use iterative deepening for time-limited search
  if (PERFORMANCE_CONFIG.ENABLE_ITERATIVE_DEEPENING) {
    return iterativeDeepening(board, availableMoves, size);
  }

  // Fixed depth search
  const maxDepth =
    PERFORMANCE_CONFIG.MAX_MINIMAX_DEPTH[
      size as keyof typeof PERFORMANCE_CONFIG.MAX_MINIMAX_DEPTH
    ] ?? 4;
  const result = minimax(
    board,
    0,
    true,
    -Infinity,
    Infinity,
    size,
    'O',
    maxDepth,
  );
  return result.bestMove ?? availableMoves[0];
};

// Main function to get AI move based on difficulty
export const getAIMove = (
  board: GameBoard,
  difficulty: Difficulty,
  size: number = DEFAULT_BOARD_SIZE,
): number => {
  try {
    validateBoardSize(size);

    if (board.length !== size * size) {
      throw new Error(
        `Board size mismatch: expected ${size * size} cells, got ${board.length}`,
      );
    }

    const availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) {
      throw new Error('No available moves on the board');
    }

    const currentCacheSize = getCacheSize(size);
    if (
      boardEvaluationCache.size === 0 ||
      currentCacheSize !== getCacheSize(DEFAULT_BOARD_SIZE)
    ) {
      initializeCaches(size);
    }

    const startTime = Date.now();
    let move: number;

    switch (difficulty) {
      case 'easy':
        move = getEasyMove(board, availableMoves, size);
        break;
      case 'medium':
        move = getMediumMove(board, availableMoves, size);
        break;
      case 'hard':
        move = getHardMove(board, availableMoves, size);
        break;
      default:
        throw new Error(`Invalid difficulty: ${difficulty}`);
    }

    const thinkTime = Date.now() - startTime;
    console.log(
      `AI (${difficulty}) took ${thinkTime}ms to decide on move ${move} for ${size}x${size} board`,
    );

    if (!availableMoves.includes(move)) {
      console.error(
        `AI selected invalid move ${move}, falling back to first available move`,
      );
      move = availableMoves[0];
    }

    return move;
  } catch (error) {
    console.error('Error in getAIMove:', error);
    const availableMoves = getAvailableMoves(board);
    return availableMoves.length > 0 ? availableMoves[0] : -1;
  }
};

// Calculate win/loss statistics from game history
export const calculateGameStats = (
  results: Array<{ result: 'win' | 'lose' | 'tie' }>,
): {
  wins: number;
  losses: number;
  ties: number;
  total: number;
  winRate: number;
} => {
  if (!Array.isArray(results)) {
    console.error('Invalid results array provided to calculateGameStats');
    return { wins: 0, losses: 0, ties: 0, total: 0, winRate: 0 };
  }

  const stats = results.reduce(
    (acc, result) => {
      if (!result || typeof result.result !== 'string') {
        console.warn('Invalid result object found in game history:', result);
        return acc;
      }

      switch (result.result) {
        case 'win':
          acc.wins++;
          break;
        case 'lose':
          acc.losses++;
          break;
        case 'tie':
          acc.ties++;
          break;
        default:
          console.warn('Unknown result type:', result.result);
      }
      return acc;
    },
    { wins: 0, losses: 0, ties: 0 },
  );

  const total = stats.wins + stats.losses + stats.ties;
  const winRate = total > 0 ? (stats.wins / total) * 100 : 0;

  return {
    ...stats,
    total,
    winRate: Math.round(winRate * 100) / 100,
  };
};

// Clear all caches to free up memory
export const clearCaches = (): void => {
  boardEvaluationCache.clear();
  transpositionTable.clear();
  console.log('All caches cleared');
};

// Get information about cache usage and performance
export const getCacheStats = () => {
  const hitRate = boardEvaluationCache.getHitRate();

  return {
    winningCombinations: winningCombinationsCache.size,
    boardEvaluations: boardEvaluationCache.size,
    transpositionTable: transpositionTable.size,
    totalMemoryUsage:
      winningCombinationsCache.size +
      boardEvaluationCache.size +
      transpositionTable.size,
    hitRate: Math.round(hitRate * 10000) / 100,
    aiConfig: AI_CONFIG,
    performanceConfig: PERFORMANCE_CONFIG,
  };
};

// Convert game state to JSON string for saving
export const serializeBoardState = (
  board: GameBoard,
  moves: { player: Player; position: number }[],
  boardSize?: number,
): string => {
  try {
    const size = boardSize || Math.sqrt(board.length);
    validateBoardSize(size);

    const data = {
      finalBoard: board,
      moves: moves,
      boardSize: size,
      timestamp: new Date().toISOString(),
      version: '2.0',
    };

    return JSON.stringify(data);
  } catch (error) {
    console.error('Error serializing board state:', error);
    throw new Error(`Failed to serialize board state: ${error.message}`);
  }
};

// Convert JSON string back to game state
export const deserializeBoardState = (
  serialized: string,
): {
  finalBoard: GameBoard;
  moves: { player: Player; position: number }[];
  boardSize: number;
  timestamp: string;
} => {
  try {
    const parsed = JSON.parse(serialized);

    const finalBoard = Array.isArray(parsed.finalBoard)
      ? parsed.finalBoard
      : createEmptyBoard();
    const moves = Array.isArray(parsed.moves) ? parsed.moves : [];
    const boardSize =
      typeof parsed.boardSize === 'number'
        ? parsed.boardSize
        : DEFAULT_BOARD_SIZE;
    const timestamp =
      typeof parsed.timestamp === 'string'
        ? parsed.timestamp
        : new Date().toISOString();

    validateBoardSize(boardSize);

    if (finalBoard.length !== boardSize * boardSize) {
      console.warn(
        'Board size mismatch in deserialized data, creating new board',
      );
      return {
        finalBoard: createEmptyBoard(boardSize),
        moves: [],
        boardSize,
        timestamp: new Date().toISOString(),
      };
    }

    return { finalBoard, moves, boardSize, timestamp };
  } catch (error) {
    console.error('Error deserializing board state:', error);
    return {
      finalBoard: createEmptyBoard(),
      moves: [],
      boardSize: DEFAULT_BOARD_SIZE,
      timestamp: new Date().toISOString(),
    };
  }
};

// Recreate a game by replaying all moves step by step
export const replayGame = (
  moves: { player: Player; position: number }[],
  size: number = DEFAULT_BOARD_SIZE,
): GameBoard[] => {
  try {
    validateBoardSize(size);

    if (!Array.isArray(moves)) {
      throw new Error('Moves must be an array');
    }

    const boardStates: GameBoard[] = [createEmptyBoard(size)];
    let currentBoard = createEmptyBoard(size);

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];

      if (!move || typeof move.position !== 'number' || !move.player) {
        console.warn(`Invalid move at index ${i}:`, move);
        continue;
      }

      try {
        currentBoard = makeMove(currentBoard, move.position, move.player);
        boardStates.push([...currentBoard]);
      } catch (error) {
        console.error(`Error applying move ${i}:`, error);
        break;
      }
    }

    return boardStates;
  } catch (error) {
    console.error('Error in replayGame:', error);
    return [createEmptyBoard(size)];
  }
};

// Old functions kept for backwards compatibility
export const checkWin = (board: Board, player: Player): boolean => {
  console.warn('checkWin is deprecated, use checkWinner instead');
  try {
    const size = Math.sqrt(board.length);
    const winningCombinations = getWinningCombinations(size);
    return winningCombinations.some(condition =>
      condition.every(index => board[index] === player),
    );
  } catch (error) {
    console.error('Error in deprecated checkWin function:', error);
    return false;
  }
};

export const checkDraw = (board: Board): boolean => {
  console.warn('checkDraw is deprecated, use checkWinner instead');
  try {
    return board.every(cell => cell !== null);
  } catch (error) {
    console.error('Error in deprecated checkDraw function:', error);
    return false;
  }
};

export const getRandomMove = (board: Board): number => {
  console.warn(
    'getRandomMove is deprecated, use getAIMove with "easy" difficulty instead',
  );
  try {
    const availableMoves = getAvailableMoves(board);
    return availableMoves.length > 0
      ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
      : -1;
  } catch (error) {
    console.error('Error in deprecated getRandomMove function:', error);
    return -1;
  }
};

// Make configuration available to other parts of the app
export {
  AI_CONFIG,
  DEFAULT_BOARD_SIZE,
  MAX_BOARD_SIZE,
  MIN_BOARD_SIZE,
  PERFORMANCE_CONFIG,
};

// Set up the caches when the module loads
initializeCaches();

console.log(
  '🎮 Advanced Tic-Tac-Toe AI Engine initialized with reviewer optimizations',
);
