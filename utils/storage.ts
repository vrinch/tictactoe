import * as SQLite from 'expo-sqlite';
import { showErrorToast, showSuccessToast } from '../components/toast';
import { GameResult, UserProfile, UserSettings } from './types';

const DATABASE_NAME = 'tictactoe_v1.db';
let db: SQLite.SQLiteDatabase;

// Open a persistent SQLite database for the app
try {
  db = SQLite.openDatabaseSync(DATABASE_NAME);
  console.log('Database connection opened successfully');
} catch (error: any) {
  console.error('Failed to open database:', error);
  showErrorToast('Failed to open database');
}

// Generate unique userId
const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Check if column exists in table
const columnExists = async (
  tableName: string,
  columnName: string,
): Promise<boolean> => {
  try {
    const result = await db.getFirstAsync(`PRAGMA table_info(${tableName})`);
    if (!result) return false;

    const columns = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
    return columns.some((col: any) => col.name === columnName);
  } catch {
    return false;
  }
};

// Set up database tables if they don't exist
export const initializeDatabase = async (): Promise<void> => {
  try {
    // console.log('Initializing database...');

    // Main history of played games - WITH user_id
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS game_results (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        username TEXT NOT NULL,
        result TEXT NOT NULL,
        date TEXT NOT NULL,
        moves INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        board_state TEXT NOT NULL DEFAULT '',
        game_duration INTEGER DEFAULT 0
      );
    `);

    // Info for active user - WITH user_id
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY,
        user_id TEXT UNIQUE,
        username TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL,
        games_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        ties INTEGER DEFAULT 0,
        created_date TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT DEFAULT CURRENT_TIMESTAMP,
        is_logged_in INTEGER DEFAULT 1
      );
    `);

    // App settings - WITH user_id
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY,
        user_id TEXT,
        username TEXT NOT NULL,
        ai_plays_first INTEGER DEFAULT 0,
        sound_enabled INTEGER DEFAULT 1,
        haptic_enabled INTEGER DEFAULT 1,
        auto_reset_board INTEGER DEFAULT 1,
        reset_delay INTEGER DEFAULT 3000
      );
    `);

    // Run migration for any existing data
    await migrateExistingData();

    // console.log('Database initialized successfully');
  } catch (error: any) {
    console.error('Error initializing database:', error);
    showErrorToast(`Database initialization failed: ${error.message}`);
    throw error;
  }
};

// Migrate existing data to include user_id
const migrateExistingData = async (): Promise<void> => {
  try {
    // Add columns if they don't exist (safe operation)
    const userIdExistsInProfiles = await columnExists(
      'user_profile',
      'user_id',
    );
    if (!userIdExistsInProfiles) {
      try {
        await db.execAsync('ALTER TABLE user_profile ADD COLUMN user_id TEXT;');
        // console.log('Added user_id column to user_profile');
      } catch (error: any) {
        // console.log('user_id column might already exist in user_profile');
      }
    }

    const userIdExistsInResults = await columnExists('game_results', 'user_id');
    if (!userIdExistsInResults) {
      try {
        await db.execAsync('ALTER TABLE game_results ADD COLUMN user_id TEXT;');
        // console.log('Added user_id column to game_results');
      } catch (error: any) {
        // console.log('user_id column might already exist in game_results');
      }
    }

    const userIdExistsInSettings = await columnExists(
      'app_settings',
      'user_id',
    );
    if (!userIdExistsInSettings) {
      try {
        await db.execAsync('ALTER TABLE app_settings ADD COLUMN user_id TEXT;');
        // console.log('Added user_id column to app_settings');
      } catch (error: any) {
        // console.log('user_id column might already exist in app_settings');
      }
    }

    // Check if there are users without user_id
    const usersNeedingMigration = await db.getAllAsync(
      'SELECT id, username FROM user_profile WHERE user_id IS NULL OR user_id = ""',
    );

    if (usersNeedingMigration.length > 0) {
      // console.log(
      //   `Migrating ${usersNeedingMigration.length} users to userId system...`,
      // );

      for (const user of usersNeedingMigration) {
        const userId = generateUserId();

        // Update user profile
        await db.runAsync('UPDATE user_profile SET user_id = ? WHERE id = ?', [
          userId,
          (user as any).id,
        ]);

        // Update game results
        await db.runAsync(
          'UPDATE game_results SET user_id = ? WHERE username = ? AND (user_id IS NULL OR user_id = "")',
          [userId, (user as any).username],
        );

        // Update settings
        await db.runAsync(
          'UPDATE app_settings SET user_id = ? WHERE username = ? AND (user_id IS NULL OR user_id = "")',
          [userId, (user as any).username],
        );
      }

      // console.log(
      //   `Migration completed for ${usersNeedingMigration.length} users`,
      // );
    }
  } catch (error: any) {
    // console.log('Migration handled or no existing data:', error);
  }
};

// Check if a user exists in the user_profile table
export const checkUserExists = async (username: string): Promise<boolean> => {
  try {
    await initializeDatabase();

    const result = await db.getFirstAsync(
      'SELECT username FROM user_profile WHERE username = ?',
      [username],
    );
    return !!result;
  } catch (error: any) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

// Registers or logs in a user by username & color
export const createOrLoginUser = async (
  username: string,
  color: string,
): Promise<UserProfile | null> => {
  try {
    await initializeDatabase();
    await logoutUser();

    // Try to find user by username
    const existingUser = await db.getFirstAsync(
      'SELECT * FROM user_profile WHERE username = ?',
      [username],
    );

    if (existingUser) {
      let userId = (existingUser as any).user_id;

      // Ensure user has userId (for migration)
      if (!userId || userId === '') {
        userId = generateUserId();
        await db.runAsync(
          'UPDATE user_profile SET user_id = ? WHERE username = ?',
          [userId, username],
        );
      }

      await db.runAsync(
        'UPDATE user_profile SET is_logged_in = 1, last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
        [userId],
      );

      showSuccessToast(`Welcome back, ${username}!`);

      return {
        userId: userId as string,
        username: (existingUser as any).username as string,
        color: (existingUser as any).color as string,
        gamesPlayed: (existingUser as any).games_played as number,
        wins: (existingUser as any).wins as number,
        losses: (existingUser as any).losses as number,
        ties: (existingUser as any).ties as number,
      };
    } else {
      // New user: create profile with userId
      const userId = generateUserId();

      await db.runAsync(
        `INSERT INTO user_profile (user_id, username, color, games_played, wins, losses, ties, is_logged_in) 
         VALUES (?, ?, ?, 0, 0, 0, 0, 1)`,
        [userId, username, color],
      );

      await saveUserSettings(userId, {
        aiPlaysFirst: false,
        soundEnabled: true,
        hapticEnabled: true,
        autoResetBoard: true,
        resetDelay: 3000,
      });

      showSuccessToast(`Welcome to Tic Tac Toe, ${username}!`);

      return {
        userId,
        username,
        color,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      };
    }
  } catch (error: any) {
    console.error('Error creating/logging in user:', error);
    showErrorToast(`Failed to login: ${error.message}`);
    throw error;
  }
};

// Save a completed game result into the database
export const saveGameResult = async (
  result: GameResult & {
    boardState: string;
    gameDuration?: number;
    userId: string;
  },
): Promise<void> => {
  try {
    await db.runAsync(
      'INSERT INTO game_results (id, user_id, username, result, date, moves, difficulty, board_state, game_duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        result.id,
        result.userId,
        result.username,
        result.result,
        result.date,
        result.moves,
        result.difficulty,
        result.boardState,
        result.gameDuration || 0,
      ],
    );
  } catch (error: any) {
    console.error('Error saving game result:', error);
    showErrorToast(`Failed to save game: ${error.message}`);
    throw error;
  }
};

// Get up to 50 game history entries with current username
export const getGameHistory = async (
  userId?: string,
): Promise<
  (GameResult & {
    boardState: string;
    gameDuration: number;
  })[]
> => {
  try {
    let query: string;
    let params: string[];

    if (userId) {
      // For specific user - try to get current username via JOIN
      query = `
        SELECT 
          gr.*,
          COALESCE(up.username, gr.username) as current_username 
        FROM game_results gr 
        LEFT JOIN user_profile up ON gr.user_id = up.user_id 
        WHERE gr.user_id = ? 
        ORDER BY gr.date DESC LIMIT 50
      `;
      params = [userId];
    } else {
      // For all users
      query = `
        SELECT 
          gr.*,
          COALESCE(up.username, gr.username) as current_username 
        FROM game_results gr 
        LEFT JOIN user_profile up ON gr.user_id = up.user_id 
        ORDER BY gr.date DESC LIMIT 50
      `;
      params = [];
    }

    const results = await db.getAllAsync(query, params);

    return results.map((row: any) => ({
      id: row.id as string,
      username: row.current_username as string, // Always use current username
      result: row.result as 'win' | 'lose' | 'tie',
      date: row.date as string,
      moves: row.moves as number,
      difficulty: row.difficulty as string,
      boardState: row.board_state as string,
      gameDuration: row.game_duration as number,
    }));
  } catch (error: any) {
    console.error('Error getting game history:', error);
    showErrorToast(`Failed to load history: ${error.message}`);
    return [];
  }
};

// Save or update the user profile row in SQLite
export const saveOrUpdateUserProfile = async (
  profile: UserProfile,
): Promise<void> => {
  try {
    if (!profile.userId) {
      throw new Error('Profile must have a userId');
    }

    const existingUser = await db.getFirstAsync(
      'SELECT * FROM user_profile WHERE user_id = ?',
      [profile.userId],
    );

    if (existingUser) {
      await db.runAsync(
        `UPDATE user_profile SET 
         username = ?, color = ?, games_played = ?, wins = ?, losses = ?, ties = ?, 
         last_login = CURRENT_TIMESTAMP, is_logged_in = 1
         WHERE user_id = ?`,
        [
          profile.username,
          profile.color,
          profile.gamesPlayed,
          profile.wins,
          profile.losses,
          profile.ties,
          profile.userId,
        ],
      );
    } else {
      // Create new user
      await db.runAsync(
        `INSERT INTO user_profile (user_id, username, color, games_played, wins, losses, ties, is_logged_in) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          profile.userId,
          profile.username,
          profile.color,
          profile.gamesPlayed,
          profile.wins,
          profile.losses,
          profile.ties,
        ],
      );

      // Create default settings for new user
      await saveUserSettings(profile.userId, {
        aiPlaysFirst: false,
        soundEnabled: true,
        hapticEnabled: true,
        autoResetBoard: true,
        resetDelay: 3000,
      });
    }
  } catch (error: any) {
    console.error('Error saving user profile:', error);
    showErrorToast(`Failed to save profile: ${error.message}`);
    throw error;
  }
};

// Get currently logged-in user profile, or null if none exists
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM user_profile WHERE is_logged_in = 1 LIMIT 1;',
    );

    if (result && (result as any).user_id) {
      return {
        userId: (result as any).user_id as string,
        username: (result as any).username as string,
        color: (result as any).color as string,
        gamesPlayed: (result as any).games_played as number,
        wins: (result as any).wins as number,
        losses: (result as any).losses as number,
        ties: (result as any).ties as number,
      };
    }

    return null;
  } catch (error: any) {
    console.error('Error getting current user:', error);
    showErrorToast(`Failed to get user: ${error.message}`);
    return null;
  }
};

// Logs out all users (resets is_logged_in)
export const logoutUser = async (): Promise<void> => {
  try {
    await db.runAsync('UPDATE user_profile SET is_logged_in = 0');
  } catch (error: any) {
    console.error('Error logging out user:', error);
    showErrorToast(`Failed to logout: ${error.message}`);
    throw error;
  }
};

// Login a user by their username (sets is_logged_in)
export const loginUser = async (
  username: string,
): Promise<UserProfile | null> => {
  try {
    await logoutUser();

    const user = await db.getFirstAsync(
      'SELECT * FROM user_profile WHERE username = ?',
      [username],
    );

    if (user) {
      let userId = (user as any).user_id;

      // Ensure user has userId (for migration)
      if (!userId || userId === '') {
        userId = generateUserId();
        await db.runAsync(
          'UPDATE user_profile SET user_id = ? WHERE username = ?',
          [userId, username],
        );
      }

      await db.runAsync(
        'UPDATE user_profile SET is_logged_in = 1, last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
        [userId],
      );

      showSuccessToast(`Welcome back, ${username}!`);

      return {
        userId: userId as string,
        username: (user as any).username as string,
        color: (user as any).color as string,
        gamesPlayed: (user as any).games_played as number,
        wins: (user as any).wins as number,
        losses: (user as any).losses as number,
        ties: (user as any).ties as number,
      };
    }

    return null;
  } catch (error: any) {
    console.error('Error logging in user:', error);
    showErrorToast(`Failed to login: ${error.message}`);
    return null;
  }
};

// Fetch all user profiles (for switching accounts, etc.)
export const getAllUsers = async (): Promise<
  { userId: string; username: string; color: string; lastLogin: string }[]
> => {
  try {
    const users = await db.getAllAsync(
      'SELECT user_id, username, color, last_login FROM user_profile WHERE user_id IS NOT NULL ORDER BY last_login DESC',
    );

    return users.map((user: any) => ({
      userId: user.user_id as string,
      username: user.username as string,
      color: user.color as string,
      lastLogin: user.last_login as string,
    }));
  } catch (error: any) {
    console.error('Error getting all users:', error);
    return [];
  }
};

// Save or update user settings
export const saveUserSettings = async (
  userId: string,
  settings: UserSettings,
): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('userId is required for saving settings');
    }

    const existingSettings = await db.getFirstAsync(
      'SELECT id FROM app_settings WHERE user_id = ?',
      [userId],
    );

    if (existingSettings) {
      await db.runAsync(
        `UPDATE app_settings SET 
         ai_plays_first = ?, sound_enabled = ?, haptic_enabled = ?, 
         auto_reset_board = ?, reset_delay = ?
         WHERE user_id = ?`,
        [
          settings.aiPlaysFirst ? 1 : 0,
          settings.soundEnabled ? 1 : 0,
          settings.hapticEnabled ? 1 : 0,
          settings.autoResetBoard ? 1 : 0,
          settings.resetDelay,
          userId,
        ],
      );
    } else {
      // Get username for the settings record
      const user = await db.getFirstAsync(
        'SELECT username FROM user_profile WHERE user_id = ?',
        [userId],
      );

      const username = (user as any)?.username || 'Unknown';

      await db.runAsync(
        `INSERT INTO app_settings 
         (user_id, username, ai_plays_first, sound_enabled, haptic_enabled, auto_reset_board, reset_delay) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          username,
          settings.aiPlaysFirst ? 1 : 0,
          settings.soundEnabled ? 1 : 0,
          settings.hapticEnabled ? 1 : 0,
          settings.autoResetBoard ? 1 : 0,
          settings.resetDelay,
        ],
      );
    }
  } catch (error: any) {
    console.error('Error saving user settings:', error);
    showErrorToast(`Failed to save settings: ${error.message}`);
    throw error;
  }
};

// Get settings for one user (returns default if not found)
export const getUserSettings = async (
  userId: string,
): Promise<UserSettings> => {
  try {
    if (!userId) {
      throw new Error('userId is required for getting settings');
    }

    const result = await db.getFirstAsync(
      'SELECT * FROM app_settings WHERE user_id = ?',
      [userId],
    );

    if (result) {
      return {
        aiPlaysFirst: Boolean((result as any).ai_plays_first),
        soundEnabled: Boolean((result as any).sound_enabled),
        hapticEnabled: Boolean((result as any).haptic_enabled),
        autoResetBoard: Boolean((result as any).auto_reset_board),
        resetDelay: (result as any).reset_delay as number,
      };
    }

    // Create and return default settings if none exist
    const defaultSettings: UserSettings = {
      aiPlaysFirst: false,
      soundEnabled: true,
      hapticEnabled: true,
      autoResetBoard: true,
      resetDelay: 3000,
    };

    await saveUserSettings(userId, defaultSettings);
    return defaultSettings;
  } catch (error: any) {
    console.error('Error getting user settings:', error);
    showErrorToast(`Failed to load settings: ${error.message}`);

    // Return safe defaults on error
    return {
      aiPlaysFirst: false,
      soundEnabled: true,
      hapticEnabled: true,
      autoResetBoard: true,
      resetDelay: 3000,
    };
  }
};

// Delete a user's entire game history and set all stats to 0
export const clearUserGameHistory = async (userId: string): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('userId is required for clearing history');
    }

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM game_results WHERE user_id = ?', [userId]);
      await db.runAsync(
        'UPDATE user_profile SET games_played = 0, wins = 0, losses = 0, ties = 0 WHERE user_id = ?',
        [userId],
      );
    });

    showSuccessToast('Game history cleared successfully');
  } catch (error: any) {
    console.error('Error clearing user game history:', error);
    showErrorToast(`Failed to clear history: ${error.message}`);
    throw error;
  }
};

// Increment stats for win/loss/tie results
export const updateUserStats = async (
  userId: string,
  result: 'win' | 'lose' | 'tie',
): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('userId is required for updating stats');
    }

    const updateField =
      result === 'win'
        ? 'wins = wins + 1'
        : result === 'lose'
          ? 'losses = losses + 1'
          : 'ties = ties + 1';

    await db.runAsync(
      `UPDATE user_profile SET 
       games_played = games_played + 1, 
       ${updateField} 
       WHERE user_id = ?`,
      [userId],
    );
  } catch (error: any) {
    console.error('Error updating user stats:', error);
    showErrorToast(`Failed to update stats: ${error.message}`);
    throw error;
  }
};

// Get database-wide stats for debugging or admin
export const getDatabaseStats = async () => {
  try {
    const gameCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM game_results;',
    );
    const profileCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM user_profile;',
    );

    return {
      totalGames: ((gameCount as any)?.count as number) || 0,
      hasProfile: ((profileCount as any)?.count as number) > 0,
    };
  } catch (error: any) {
    console.error('Error getting database stats:', error);
    return { totalGames: 0, hasProfile: false };
  }
};

// Manual migration function (if needed)
export const migrateToUserId = async (): Promise<void> => {
  await migrateExistingData();
};

// Extra aliases for legacy code
export const saveUserProfile = saveOrUpdateUserProfile;
export const getUserProfile = getCurrentUser;
