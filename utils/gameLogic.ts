import { BOARD_SIZE } from '../constants/config';
import { Board, Difficulty, GameBoard, Player } from './types';

// Advanced LRU Cache Implementation
class LRUCache<K, V> {
  private capacity: number;
  private cache = new Map<K, V>();
  private usage = new Set<K>();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      this.usage.delete(key);
      this.usage.add(key);
      return this.cache.get(key);
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing - move to end
      this.usage.delete(key);
      this.usage.add(key);
      this.cache.set(key, value);
      return;
    }

    // Check capacity
    if (this.cache.size >= this.capacity) {
      // Remove least recently used (first in usage set)
      const lru = this.usage.values().next().value;
      this.usage.delete(lru);
      this.cache.delete(lru);
    }

    // Add new entry
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

  // Override get to track hit rate
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

// AI Configuration - All magic numbers documented and configurable
const AI_CONFIG = {
  // Scoring system
  WIN_SCORE: 1000, // Score for a winning position
  LOSS_SCORE: -1000, // Score for a losing position
  TIE_SCORE: 0, // Score for a tie game

  // Move prioritization
  CENTER_BONUS: 30, // Priority boost for center positions
  CORNER_BONUS: 20, // Priority boost for corner positions
  EDGE_BONUS: 10, // Priority boost for edge positions

  // Line evaluation
  LINE_SCORE_BASE: 10, // Base multiplier for line scores
  FORK_BONUS: 50, // Bonus for creating multiple threats
  BLOCK_BONUS: 40, // Bonus for blocking opponent threats

  // Search configuration
  TIME_LIMIT_MS: 1000, // Time limit for hard AI thinking
  MIN_SEARCH_DEPTH: 1, // Minimum search depth
  MAX_SEARCH_DEPTH: 12, // Maximum search depth

  // Cache configuration
  CACHE_SIZE: {
    SMALL_BOARD: 15000, // 3x3 boards
    MEDIUM_BOARD: 8000, // 4x4-6x6 boards
    LARGE_BOARD: 2000, // 7x7+ boards
  },

  // Performance thresholds
  LARGE_BOARD_THRESHOLD: 7, // When to switch to simplified strategy
  ENDGAME_THRESHOLD: 8, // When to search to completion

  // AI behavior tuning
  EASY_SMART_PERCENTAGE: 0.25, // How often easy AI plays optimally
  MEDIUM_RANDOM_PERCENTAGE: 0.15, // How often medium AI plays randomly
} as const;

// Performance configuration with dynamic depth limits
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
  ENABLE_TRANSPOSITION_TABLE: true,
  ENABLE_ITERATIVE_DEEPENING: true,
  ENABLE_MOVE_ORDERING: true,
} as const;

// Smart cache system with LRU eviction
const getCacheSize = (size: number): number => {
  if (size <= 3) return AI_CONFIG.CACHE_SIZE.SMALL_BOARD;
  if (size <= 6) return AI_CONFIG.CACHE_SIZE.MEDIUM_BOARD;
  return AI_CONFIG.CACHE_SIZE.LARGE_BOARD;
};

// Initialize caches with appropriate sizes
const winningCombinationsCache = new Map<number, number[][]>();
let boardEvaluationCache: LRUCache<string, number>;
let transpositionTable: LRUCache<
  string,
  { score: number; depth: number; flag: 'exact' | 'upper' | 'lower' }
>;

// Initialize caches for default board size
const initializeCaches = (size: number = BOARD_SIZE) => {
  const cacheSize = getCacheSize(size);
  boardEvaluationCache = new LRUCache<string, number>(cacheSize);
  transpositionTable = new LRUCache<
    string,
    { score: number; depth: number; flag: 'exact' | 'upper' | 'lower' }
  >(cacheSize);
};

// Initialize with default size
initializeCaches();

// Input validation utilities
const validateBoardSize = (size: number): void => {
  if (!Number.isInteger(size) || size < 3 || size > 20) {
    throw new Error(
      `Invalid board size: ${size}. Must be an integer between 3 and 20.`,
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

// Generate winning combinations with caching and validation
export const getWinningCombinations = (size: number): number[][] => {
  validateBoardSize(size);

  if (winningCombinationsCache.has(size)) {
    return winningCombinationsCache.get(size)!;
  }

  const combinations: number[][] = [];

  // Generate all rows
  for (let row = 0; row < size; row++) {
    const rowCombination: number[] = [];
    for (let col = 0; col < size; col++) {
      rowCombination.push(row * size + col);
    }
    combinations.push(rowCombination);
  }

  // Generate all columns
  for (let col = 0; col < size; col++) {
    const colCombination: number[] = [];
    for (let row = 0; row < size; row++) {
      colCombination.push(row * size + col);
    }
    combinations.push(colCombination);
  }

  // Generate main diagonal (top-left to bottom-right)
  const mainDiagonal: number[] = [];
  for (let i = 0; i < size; i++) {
    mainDiagonal.push(i * size + i);
  }
  combinations.push(mainDiagonal);

  // Generate anti-diagonal (top-right to bottom-left)
  const antiDiagonal: number[] = [];
  for (let i = 0; i < size; i++) {
    antiDiagonal.push(i * size + (size - 1 - i));
  }
  combinations.push(antiDiagonal);

  winningCombinationsCache.set(size, combinations);
  return combinations;
};

// Create empty board with validation
export const createEmptyBoard = (size: number = BOARD_SIZE): GameBoard => {
  validateBoardSize(size);
  const cellCount = size * size;
  return Array(cellCount).fill(null);
};

// Enhanced winner checking with early termination
export const checkWinner = (
  board: GameBoard,
  size: number = BOARD_SIZE,
): Player | 'tie' | null => {
  validateBoardSize(size);

  if (board.length !== size * size) {
    throw new Error(
      `Board size mismatch: expected ${size * size} cells, got ${board.length}`,
    );
  }

  const winningCombinations = getWinningCombinations(size);

  // Check each winning combination
  for (const combination of winningCombinations) {
    const firstCell = board[combination[0]];
    if (firstCell && combination.every(index => board[index] === firstCell)) {
      return firstCell;
    }
  }

  // Check for tie - all cells filled
  if (board.every(cell => cell !== null)) {
    return 'tie';
  }

  return null;
};

// Optimized available moves calculation
export const getAvailableMoves = (board: GameBoard): number[] => {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
};

// Robust move making with comprehensive validation
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

// Enhanced board hash for better cache performance
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

// Get strategic positions based on board size
const getStrategicPositions = (size: number) => {
  const positions = {
    center: [] as number[],
    corners: [] as number[],
    edges: [] as number[],
  };

  const mid = Math.floor(size / 2);

  // Calculate center positions
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

  // Calculate corners
  positions.corners = [
    0, // Top-left
    size - 1, // Top-right
    size * (size - 1), // Bottom-left
    size * size - 1, // Bottom-right
  ];

  // Calculate edges (excluding corners)
  for (let i = 1; i < size - 1; i++) {
    positions.edges.push(i); // Top edge
    positions.edges.push(i * size); // Left edge
    positions.edges.push((size - 1) * size + i); // Bottom edge
    positions.edges.push(i * size + (size - 1)); // Right edge
  }

  return positions;
};

// Enhanced line evaluation with fork detection
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

  // Line is blocked if both players have pieces
  if (maxCount > 0 && minCount > 0) return 0;

  // Calculate score based on pieces and potential
  if (maxCount > 0) {
    // Exponential scoring for pieces in a line
    let score = Math.pow(AI_CONFIG.LINE_SCORE_BASE, maxCount);

    // Bonus for lines close to winning
    if (maxCount === size - 1) {
      score += AI_CONFIG.FORK_BONUS;
    }

    return score;
  }

  if (minCount > 0) {
    // Negative scoring for opponent pieces
    let score = -Math.pow(AI_CONFIG.LINE_SCORE_BASE, minCount);

    // Penalty for opponent close to winning
    if (minCount === size - 1) {
      score -= AI_CONFIG.BLOCK_BONUS;
    }

    return score;
  }

  return 0; // Empty line has neutral value
};

// Detect and score forks (multiple winning threats)
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

    // Count how many winning lines this move creates
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

      // A threat is created if we have size-1 pieces and 1 empty
      if (playerCount === size - 1 && emptyCount === 1) {
        threats++;
      }
    }

    // Multiple threats = fork
    if (threats >= 2) {
      forkScore += AI_CONFIG.FORK_BONUS * threats;
    }
  }

  return forkScore;
};

// Advanced board evaluation with multiple heuristics
const evaluateBoard = (
  board: GameBoard,
  size: number,
  maximizingPlayer: Player = 'O',
): number => {
  const boardHash = createBoardHash(board, 0, true);

  // Check cache first
  const cached = boardEvaluationCache.getWithStats(boardHash);
  if (cached !== undefined) {
    return cached;
  }

  const winner = checkWinner(board, size);

  // Terminal positions
  if (winner === maximizingPlayer) {
    boardEvaluationCache.set(boardHash, AI_CONFIG.WIN_SCORE);
    return AI_CONFIG.WIN_SCORE;
  }
  if (winner === (maximizingPlayer === 'O' ? 'X' : 'O')) {
    boardEvaluationCache.set(boardHash, AI_CONFIG.LOSS_SCORE);
    return AI_CONFIG.LOSS_SCORE;
  }
  if (winner === 'tie') {
    boardEvaluationCache.set(boardHash, AI_CONFIG.TIE_SCORE);
    return AI_CONFIG.TIE_SCORE;
  }

  let score = 0;
  const winningCombinations = getWinningCombinations(size);
  const strategicPositions = getStrategicPositions(size);

  // Evaluate all winning lines
  for (const combination of winningCombinations) {
    score += evaluateLine(board, combination, maximizingPlayer, size);
  }

  // Strategic position bonuses
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

  // Fork detection for advanced play
  if (size >= 4) {
    score += detectForks(board, maximizingPlayer, size);
    score -= detectForks(board, maximizingPlayer === 'O' ? 'X' : 'O', size);
  }

  boardEvaluationCache.set(boardHash, score);
  return score;
};

// Enhanced move ordering with game-specific heuristics
const getAdvancedMovePriority = (
  position: number,
  board: GameBoard,
  size: number,
  player: Player,
): number => {
  let priority = 0;
  const strategicPositions = getStrategicPositions(size);

  // Base positional value
  if (strategicPositions.center.includes(position)) {
    priority += AI_CONFIG.CENTER_BONUS;
  } else if (strategicPositions.corners.includes(position)) {
    priority += AI_CONFIG.CORNER_BONUS;
  } else if (strategicPositions.edges.includes(position)) {
    priority += AI_CONFIG.EDGE_BONUS;
  }

  // Check if this move creates immediate threats
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

    // Immediate win
    if (playerCount === size) {
      priority += 10000; // Highest priority
    }
    // Create threat (one move from win)
    else if (playerCount === size - 1 && emptyCount === 1) {
      threats++;
    }
    // Block opponent threat
    else if (opponentCount === size - 1 && emptyCount === 1) {
      blocks++;
    }
  }

  priority += threats * AI_CONFIG.FORK_BONUS;
  priority += blocks * AI_CONFIG.BLOCK_BONUS;

  return priority;
};

// Order moves for optimal alpha-beta pruning
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
    return priorityB - priorityA;
  });
};

// Advanced minimax with all optimizations
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
  // Time limit check for iterative deepening
  if (startTime && Date.now() - startTime > AI_CONFIG.TIME_LIMIT_MS) {
    return { score: evaluateBoard(board, size, maximizingPlayer) };
  }

  const depthLimit =
    maxDepth ??
    PERFORMANCE_CONFIG.MAX_MINIMAX_DEPTH[
      size as keyof typeof PERFORMANCE_CONFIG.MAX_MINIMAX_DEPTH
    ] ??
    4;

  // Transposition table lookup
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

  // Terminal node evaluation
  const winner = checkWinner(board, size);
  if (winner === maximizingPlayer) {
    const score = AI_CONFIG.WIN_SCORE - depth; // Prefer faster wins
    return { score };
  }
  if (winner === (maximizingPlayer === 'O' ? 'X' : 'O')) {
    const score = AI_CONFIG.LOSS_SCORE + depth; // Prefer slower losses
    return { score };
  }
  if (winner === 'tie') {
    return { score: AI_CONFIG.TIE_SCORE };
  }

  // Depth limit reached
  if (depth >= depthLimit) {
    const score = evaluateBoard(board, size, maximizingPlayer);
    return { score };
  }

  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) {
    return { score: AI_CONFIG.TIE_SCORE };
  }

  let bestMove: number | undefined;
  let bestScore: number;
  let flag: 'exact' | 'upper' | 'lower' = 'exact';

  if (isMaximizing) {
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

      if (beta <= alpha) {
        flag = 'lower';
        break; // Beta cutoff
      }
    }
  } else {
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

      if (beta <= alpha) {
        flag = 'upper';
        break; // Alpha cutoff
      }
    }
  }

  // Store in transposition table
  if (PERFORMANCE_CONFIG.ENABLE_TRANSPOSITION_TABLE) {
    transpositionTable.set(boardHash, {
      score: bestScore,
      depth,
      flag,
    });
  }

  return { score: bestScore, bestMove };
};

// Iterative deepening for time-constrained optimal play
const iterativeDeepening = (
  board: GameBoard,
  availableMoves: number[],
  size: number,
  timeLimit: number = AI_CONFIG.TIME_LIMIT_MS,
): number => {
  const startTime = Date.now();
  let bestMove = availableMoves[0];
  let depth = AI_CONFIG.MIN_SEARCH_DEPTH;

  // Ensure caches are sized for current board
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

      // If we found a winning move, no need to search deeper
      if (result.score >= AI_CONFIG.WIN_SCORE - depth) {
        break;
      }

      depth++;
    } catch (error) {
      // Time limit or other error - return best move found so far
      break;
    }
  }

  return bestMove;
};

// Enhanced Easy AI with configurable intelligence
const getEasyMove = (
  board: GameBoard,
  availableMoves: number[],
  size: number,
): number => {
  // Sometimes play optimally to keep games interesting
  if (Math.random() < AI_CONFIG.EASY_SMART_PERCENTAGE) {
    return getMediumMove(board, availableMoves, size);
  }

  // Usually random, but prefer center/corners slightly
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

// Enhanced Medium AI with better strategic understanding
const getMediumMove = (
  board: GameBoard,
  availableMoves: number[],
  size: number,
): number => {
  // Immediate win
  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, 'O');
    if (checkWinner(testBoard, size) === 'O') {
      return move;
    }
  }

  // Block immediate loss
  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, 'X');
    if (checkWinner(testBoard, size) === 'X') {
      return move;
    }
  }

  // Create or block forks on larger boards
  if (size >= 4) {
    // Look for fork opportunities
    for (const move of availableMoves) {
      const testBoard = makeMove(board, move, 'O');
      const forkScore = detectForks(testBoard, 'O', size);
      if (forkScore > AI_CONFIG.FORK_BONUS) {
        return move;
      }
    }

    // Block opponent forks
    for (const move of availableMoves) {
      const testBoard = makeMove(board, move, 'X');
      const forkScore = detectForks(testBoard, 'X', size);
      if (forkScore > AI_CONFIG.FORK_BONUS) {
        return move; // Block by taking the position
      }
    }
  }

  // Prioritize strategic positions
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

  // Small chance to play randomly to avoid being too predictable
  if (Math.random() < AI_CONFIG.MEDIUM_RANDOM_PERCENTAGE) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Use simple evaluation for remaining moves
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

// Elite Hard AI with full optimization suite
const getHardMove = (
  board: GameBoard,
  availableMoves: number[],
  size: number,
): number => {
  // Immediate win check
  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, 'O');
    if (checkWinner(testBoard, size) === 'O') {
      return move;
    }
  }

  // For very large boards, fall back to medium strategy
  if (size > AI_CONFIG.LARGE_BOARD_THRESHOLD) {
    console.log(
      `Board size ${size}x${size} too large for optimal AI - using strategic play`,
    );
    return getMediumMove(board, availableMoves, size);
  }

  const moveCount = board.filter(cell => cell !== null).length;
  const totalCells = size * size;
  const remainingMoves = totalCells - moveCount;

  // Near endgame - search to completion
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

  // Use iterative deepening for time-bounded optimal play
  if (PERFORMANCE_CONFIG.ENABLE_ITERATIVE_DEEPENING) {
    return iterativeDeepening(board, availableMoves, size);
  }

  // Fallback to fixed-depth search
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

// Main AI interface with error handling and logging
export const getAIMove = (
  board: GameBoard,
  difficulty: Difficulty,
  size: number = BOARD_SIZE,
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

    // Ensure caches are properly sized for current board
    const currentCacheSize = getCacheSize(size);
    if (
      boardEvaluationCache.size === 0 ||
      currentCacheSize !== getCacheSize(BOARD_SIZE)
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

// Enhanced statistics calculation with error handling
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
    winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
  };
};

// Performance monitoring and cache management
export const clearCaches = (): void => {
  boardEvaluationCache.clear();
  transpositionTable.clear();
  console.log('All caches cleared');
};

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
    hitRate: Math.round(hitRate * 10000) / 100, // Percentage with 2 decimal places
    aiConfig: AI_CONFIG,
    performanceConfig: PERFORMANCE_CONFIG,
  };
};

// Enhanced serialization with board size metadata
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
      version: '2.0', // Version for future compatibility
    };

    return JSON.stringify(data);
  } catch (error) {
    console.error('Error serializing board state:', error);
    throw new Error(`Failed to serialize board state: ${error.message}`);
  }
};

// Robust deserialization with fallbacks
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

    // Validate parsed data
    const finalBoard = Array.isArray(parsed.finalBoard)
      ? parsed.finalBoard
      : createEmptyBoard();
    const moves = Array.isArray(parsed.moves) ? parsed.moves : [];
    const boardSize =
      typeof parsed.boardSize === 'number' ? parsed.boardSize : 3;
    const timestamp =
      typeof parsed.timestamp === 'string'
        ? parsed.timestamp
        : new Date().toISOString();

    // Additional validation
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

    return {
      finalBoard,
      moves,
      boardSize,
      timestamp,
    };
  } catch (error) {
    console.error('Error deserializing board state:', error);
    return {
      finalBoard: createEmptyBoard(),
      moves: [],
      boardSize: 3,
      timestamp: new Date().toISOString(),
    };
  }
};

// Enhanced replay with validation
export const replayGame = (
  moves: { player: Player; position: number }[],
  size: number = BOARD_SIZE,
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
        break; // Stop replay on invalid move
      }
    }

    return boardStates;
  } catch (error) {
    console.error('Error in replayGame:', error);
    return [createEmptyBoard(size)];
  }
};

// Legacy compatibility functions with deprecation warnings
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

// Export AI configuration for external tuning
export { AI_CONFIG, PERFORMANCE_CONFIG };

// Initialize default caches
initializeCaches();

console.log(
  '🎮 Advanced Tic-Tac-Toe AI Engine initialized with full optimization suite',
);
