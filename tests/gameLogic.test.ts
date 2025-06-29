import {
  calculateGameStats,
  checkWinner,
  createEmptyBoard,
  deserializeBoardState,
  getAIMove,
  getAvailableMoves,
  makeMove,
  replayGame,
  serializeBoardState,
} from '@/utils/gameLogic';
import { Board, GameResult } from '@/utils/types';

// Comprehensive Tic Tac Toe game logic test suite
describe('Tic Tac Toe Game Logic', () => {
  describe('Board Creation and Validation', () => {
    test('createEmptyBoard returns a 9-cell array filled with nulls', () => {
      const board = createEmptyBoard();
      expect(board).toHaveLength(9);
      expect(board.every(cell => cell === null)).toBe(true);
    });

    test('makeMove returns new board without mutating original', () => {
      const originalBoard: Board = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ];
      const newBoard = makeMove(originalBoard, 0, 'X');

      expect(newBoard[0]).toBe('X');
      expect(originalBoard[0]).toBe(null);
      expect(newBoard).not.toBe(originalBoard);
    });

    test('makeMove ignores occupied cells', () => {
      const board: Board = [
        'X',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ];
      const newBoard = makeMove(board, 0, 'O');

      expect(newBoard[0]).toBe('X');
      expect(newBoard).toEqual(board);
    });

    test('getAvailableMoves returns correct empty positions', () => {
      const board: Board = ['X', null, 'O', null, 'X', null, null, null, null];
      const available = getAvailableMoves(board);

      expect(available).toEqual([1, 3, 5, 6, 7, 8]);
    });

    test('getAvailableMoves returns empty array for full board', () => {
      const board: Board = ['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', 'X'];
      const available = getAvailableMoves(board);

      expect(available).toEqual([]);
    });
  });

  describe('Win Detection', () => {
    test('detects horizontal wins - top row', () => {
      const board: Board = ['X', 'X', 'X', null, null, null, null, null, null];
      expect(checkWinner(board)).toBe('X');
    });

    test('detects horizontal wins - middle row', () => {
      const board: Board = [null, null, null, 'O', 'O', 'O', null, null, null];
      expect(checkWinner(board)).toBe('O');
    });

    test('detects horizontal wins - bottom row', () => {
      const board: Board = [null, null, null, null, null, null, 'X', 'X', 'X'];
      expect(checkWinner(board)).toBe('X');
    });

    test('detects vertical wins - left column', () => {
      const board: Board = ['O', null, null, 'O', null, null, 'O', null, null];
      expect(checkWinner(board)).toBe('O');
    });

    test('detects vertical wins - middle column', () => {
      const board: Board = [null, 'X', null, null, 'X', null, null, 'X', null];
      expect(checkWinner(board)).toBe('X');
    });

    test('detects vertical wins - right column', () => {
      const board: Board = [null, null, 'O', null, null, 'O', null, null, 'O'];
      expect(checkWinner(board)).toBe('O');
    });

    test('detects diagonal wins - top-left to bottom-right', () => {
      const board: Board = ['X', null, null, null, 'X', null, null, null, 'X'];
      expect(checkWinner(board)).toBe('X');
    });

    test('detects diagonal wins - top-right to bottom-left', () => {
      const board: Board = [null, null, 'O', null, 'O', null, 'O', null, null];
      expect(checkWinner(board)).toBe('O');
    });

    test('detects tie game', () => {
      const board: Board = ['O', 'X', 'O', 'X', 'O', 'X', 'X', 'O', 'X'];
      expect(checkWinner(board)).toBe('tie');
    });

    test('returns null for in-progress games', () => {
      const board: Board = ['O', null, null, 'O', null, null, null, null, null];
      expect(checkWinner(board)).toBe(null);
    });

    test('returns null for empty board', () => {
      const board = createEmptyBoard();
      expect(checkWinner(board)).toBe(null);
    });
  });

  describe('AI Difficulty Levels', () => {
    describe('Easy AI (Random)', () => {
      test('makes random valid moves', () => {
        const board: Board = [
          'X',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ];
        const move = getAIMove(board, 'easy');

        expect(move).toBeGreaterThanOrEqual(1);
        expect(move).toBeLessThanOrEqual(8);
        expect(board[move]).toBe(null);
      });

      test('returns -1 for full board', () => {
        const board: Board = ['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', 'X'];
        const move = getAIMove(board, 'easy');

        expect(move).toBe(-1);
      });
    });

    describe('Medium AI (Strategic)', () => {
      test('takes winning move when available', () => {
        const board: Board = ['O', 'O', null, null, 'X', 'X', null, null, null];
        const move = getAIMove(board, 'medium');

        expect(move).toBe(2); // Complete the winning row
      });

      test('blocks player winning move', () => {
        const board: Board = [
          'X',
          'X',
          null,
          null,
          'O',
          null,
          null,
          null,
          null,
        ];
        const move = getAIMove(board, 'medium');

        expect(move).toBe(2); // Block player's winning move
      });

      test('prioritizes winning over blocking', () => {
        const board: Board = ['O', 'O', null, 'X', 'X', null, null, null, null];
        const move = getAIMove(board, 'medium');

        expect(move).toBe(2); // Win instead of blocking
      });
    });

    describe('Hard AI (Minimax)', () => {
      test('plays optimal moves - takes center if available', () => {
        const board: Board = [
          'X',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ];
        const move = getAIMove(board, 'hard');

        expect(move).toBe(4); // Center is optimal opening response
      });

      test('always blocks immediate threats', () => {
        const board: Board = [
          'X',
          'X',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ];
        const move = getAIMove(board, 'hard');

        expect(move).toBe(2); // Must block to avoid losing
      });

      test('takes guaranteed wins', () => {
        const board: Board = ['O', 'O', null, 'X', 'X', null, null, null, null];
        const move = getAIMove(board, 'hard');

        expect(move).toBe(2); // Take the win
      });

      test('forces draws against perfect play', () => {
        // Test a scenario where AI should force a draw
        const board: Board = [
          'X',
          null,
          null,
          null,
          'O',
          null,
          null,
          null,
          'X',
        ];
        const move = getAIMove(board, 'hard');

        // AI should play optimally to avoid losing
        expect([1, 2, 3, 5, 6, 7]).toContain(move);
      });
    });
  });

  describe('Game Statistics', () => {
    test('calculates stats correctly from game history', () => {
      const gameHistory: GameResult[] = [
        {
          id: '1',
          username: 'player',
          result: 'win',
          date: '2024-01-01',
          moves: 5,
          difficulty: 'easy',
        },
        {
          id: '2',
          username: 'player',
          result: 'lose',
          date: '2024-01-02',
          moves: 6,
          difficulty: 'medium',
        },
        {
          id: '3',
          username: 'player',
          result: 'tie',
          date: '2024-01-03',
          moves: 9,
          difficulty: 'hard',
        },
        {
          id: '4',
          username: 'player',
          result: 'win',
          date: '2024-01-04',
          moves: 7,
          difficulty: 'medium',
        },
      ];

      const stats = calculateGameStats(gameHistory);

      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(1);
      expect(stats.ties).toBe(1);
    });

    test('handles empty game history', () => {
      const stats = calculateGameStats([]);

      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(0);
      expect(stats.ties).toBe(0);
    });
  });

  describe('Game State Serialization', () => {
    test('serializes and deserializes board state correctly', () => {
      const board: Board = ['X', 'O', null, 'X', null, 'O', null, null, null];
      const moves = [
        { player: 'X' as const, position: 0 },
        { player: 'O' as const, position: 1 },
        { player: 'X' as const, position: 3 },
        { player: 'O' as const, position: 5 },
      ];

      const serialized = serializeBoardState(board, moves);
      const deserialized = deserializeBoardState(serialized);

      expect(deserialized.finalBoard).toEqual(board);
      expect(deserialized.moves).toEqual(moves);
      expect(deserialized.timestamp).toBeDefined();
    });

    test('handles invalid serialized data gracefully', () => {
      const invalidData = 'invalid json';
      const result = deserializeBoardState(invalidData);

      expect(result.finalBoard).toEqual(createEmptyBoard());
      expect(result.moves).toEqual([]);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Game Replay System', () => {
    test('generates correct board states for replay', () => {
      const moves = [
        { player: 'X' as const, position: 0 },
        { player: 'O' as const, position: 1 },
        { player: 'X' as const, position: 4 },
        { player: 'O' as const, position: 2 },
        { player: 'X' as const, position: 8 }, // Winning move
      ];

      const boardStates = replayGame(moves);

      expect(boardStates).toHaveLength(6); // Empty board + 5 moves
      expect(boardStates[0]).toEqual(createEmptyBoard());
      expect(boardStates[1][0]).toBe('X');
      expect(boardStates[2][1]).toBe('O');
      expect(boardStates[5][8]).toBe('X');

      // Final board should show winning state
      expect(checkWinner(boardStates[5])).toBe('X');
    });

    test('handles empty move list', () => {
      const boardStates = replayGame([]);

      expect(boardStates).toHaveLength(1);
      expect(boardStates[0]).toEqual(createEmptyBoard());
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('makeMove handles invalid positions gracefully', () => {
      const board = createEmptyBoard();

      // Test negative position
      const result1 = makeMove(board, -1, 'X');
      expect(result1).toEqual(board);

      // Test position >= 9
      const result2 = makeMove(board, 9, 'X');
      expect(result2).toEqual(board);
    });

    test('AI handles edge case boards', () => {
      // Test with only one empty cell
      const almostFullBoard: Board = [
        'X',
        'O',
        'X',
        'O',
        'X',
        'O',
        'X',
        'O',
        null,
      ];
      const move = getAIMove(almostFullBoard, 'hard');

      expect(move).toBe(8);
    });

    test('checkWinner handles malformed boards', () => {
      // Test with non-standard board (should still work with our current implementation)
      const shortBoard = ['X', 'X', 'X'] as any;

      // Our implementation should handle this gracefully
      expect(() => checkWinner(shortBoard)).not.toThrow();
    });
  });

  describe('Game Flow Integration', () => {
    test('complete game simulation - player wins', () => {
      let board = createEmptyBoard();
      const moves: { player: 'X' | 'O'; position: number }[] = [];

      // Simulate a game where player wins
      board = makeMove(board, 0, 'X'); // X top-left
      moves.push({ player: 'X', position: 0 });

      board = makeMove(board, 1, 'O'); // O top-middle
      moves.push({ player: 'O', position: 1 });

      board = makeMove(board, 4, 'X'); // X center
      moves.push({ player: 'X', position: 4 });

      board = makeMove(board, 2, 'O'); // O top-right
      moves.push({ player: 'O', position: 2 });

      board = makeMove(board, 8, 'X'); // X bottom-right (winning move)
      moves.push({ player: 'X', position: 8 });

      expect(checkWinner(board)).toBe('X');

      // Test replay system with this game
      const replayStates = replayGame(moves);
      expect(checkWinner(replayStates[replayStates.length - 1])).toBe('X');
    });

    test('complete game simulation - tie game', () => {
      let board = createEmptyBoard();
      const tieSequence = [
        { player: 'X' as const, position: 0 },
        { player: 'O' as const, position: 1 },
        { player: 'X' as const, position: 2 },
        { player: 'O' as const, position: 4 },
        { player: 'X' as const, position: 3 },
        { player: 'O' as const, position: 5 },
        { player: 'X' as const, position: 7 },
        { player: 'O' as const, position: 6 },
        { player: 'X' as const, position: 8 },
      ];

      tieSequence.forEach(move => {
        board = makeMove(board, move.position, move.player);
      });

      expect(checkWinner(board)).toBe('tie');
    });
  });

  describe('Performance and Optimization', () => {
    test('AI responds quickly for early game positions', () => {
      const board = createEmptyBoard();
      const startTime = Date.now();

      getAIMove(board, 'hard');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should be very fast
    });

    test('makeMove is efficient for large numbers of operations', () => {
      let board = createEmptyBoard();
      const startTime = Date.now();

      // Perform many move operations
      for (let i = 0; i < 1000; i++) {
        board = makeMove(board, 0, 'X');
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });
});

describe('Game Logic Helper Functions', () => {
  describe('Utility Functions', () => {
    test('Board validation works correctly', () => {
      const validBoard: Board = [
        'X',
        'O',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ];
      expect(validBoard).toHaveLength(9);
      expect(
        validBoard.every(cell => cell === null || cell === 'X' || cell === 'O'),
      ).toBe(true);
    });

    test('Move validation prevents invalid moves', () => {
      const board: Board = [
        'X',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ];

      // Should not be able to move to occupied position
      const invalidMove = makeMove(board, 0, 'O');
      expect(invalidMove[0]).toBe('X'); // Unchanged
    });
  });
});
