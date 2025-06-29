import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SoundState {
  isPlaying: boolean;
  lastPlayTime: number;
}

export const useGameSound = () => {
  // Create multiple instances for better concurrent playback
  const clickPlayer = useAudioPlayer(require('../assets/sounds/click.mp3'));
  const winPlayer = useAudioPlayer(require('../assets/sounds/win.mp3'));
  const losePlayer = useAudioPlayer(require('../assets/sounds/lose.mp3'));

  // Backup players for concurrent sounds
  const clickPlayer2 = useAudioPlayer(require('../assets/sounds/click.mp3'));

  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isDestroyed = useRef(false); // Track if component is destroyed

  // Track sound states
  const soundStates = useRef<{
    click: SoundState;
    win: SoundState;
    lose: SoundState;
  }>({
    click: { isPlaying: false, lastPlayTime: 0 },
    win: { isPlaying: false, lastPlayTime: 0 },
    lose: { isPlaying: false, lastPlayTime: 0 },
  });

  // Queue for pending sounds
  const soundQueue = useRef<{ type: string; timestamp: number }[]>([]);
  const isProcessingQueue = useRef(false);

  // Helper function to safely call player methods
  const safePlayerCall = async (
    player: any,
    method: string,
    ...args: any[]
  ) => {
    if (
      isDestroyed.current ||
      !player ||
      typeof player[method] !== 'function'
    ) {
      return null;
    }

    try {
      return await player[method](...args);
    } catch (error) {
      // Ignore errors from destroyed players
      if (
        error.message?.includes('NativeSharedObjectNotFoundException') ||
        error.message?.includes('Unable to find the native shared object')
      ) {
        // console.log(`Player already destroyed for method: ${method}`);
        return null;
      }
      throw error;
    }
  };

  // Initialize players
  useEffect(() => {
    const initializePlayers = async () => {
      try {
        // Wait a bit for players to be ready
        await new Promise(resolve => setTimeout(resolve, 500));

        if (isDestroyed.current) return;

        // Test if players are working
        const testPromises = [
          safePlayerCall(clickPlayer, 'load'),
          safePlayerCall(winPlayer, 'load'),
          safePlayerCall(losePlayer, 'load'),
          safePlayerCall(clickPlayer2, 'load'),
        ];

        await Promise.allSettled(testPromises);

        if (!isDestroyed.current) {
          setIsInitialized(true);
          setSoundsLoaded(true);
          // console.log('Game audio initialized successfully');

          // Process any queued sounds
          processQueue();
        }
      } catch (error) {
        // console.log('Audio initialization error:', error);
        // Still mark as loaded to allow the app to continue
        if (!isDestroyed.current) {
          setIsInitialized(true);
          setSoundsLoaded(true);
        }
      }
    };

    initializePlayers();

    // Cleanup function
    return () => {
      isDestroyed.current = true;
      soundQueue.current = [];
      isProcessingQueue.current = false;
    };
  }, []);

  // Process sound queue
  const processQueue = useCallback(async () => {
    if (
      isProcessingQueue.current ||
      soundQueue.current.length === 0 ||
      isDestroyed.current
    ) {
      return;
    }

    isProcessingQueue.current = true;

    while (soundQueue.current.length > 0 && !isDestroyed.current) {
      const sound = soundQueue.current.shift();
      if (sound) {
        await playQueuedSound(sound.type);
        // Small delay between sounds
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    isProcessingQueue.current = false;
  }, []);

  const playQueuedSound = async (type: string) => {
    if (isDestroyed.current) return;

    switch (type) {
      case 'click':
        await playClickSound();
        break;
      case 'win':
        await playWinSound();
        break;
      case 'lose':
        await playLoseSound();
        break;
    }
  };

  // Core sound playing functions
  const playClickSound = async () => {
    if (isDestroyed.current) return;

    try {
      const now = Date.now();
      const clickState = soundStates.current.click;

      // Use alternate player if main one is busy
      const player = clickState.isPlaying ? clickPlayer2 : clickPlayer;

      if (!player) return;

      // Reset and play
      await safePlayerCall(player, 'pause');
      await safePlayerCall(player, 'seekTo', 0);
      await safePlayerCall(player, 'play');

      if (!isDestroyed.current) {
        // Update state
        soundStates.current.click = {
          isPlaying: true,
          lastPlayTime: now,
        };

        // Auto-reset after sound duration
        setTimeout(() => {
          if (!isDestroyed.current) {
            soundStates.current.click.isPlaying = false;
          }
        }, 500);
      }
    } catch (error) {
      // console.log('Click sound error:', error);
      if (!isDestroyed.current) {
        soundStates.current.click.isPlaying = false;
      }
    }
  };

  const playWinSound = async () => {
    if (isDestroyed.current) return;

    try {
      const now = Date.now();

      if (!winPlayer) return;

      // Stop any conflicting sounds
      await safePlayerCall(clickPlayer, 'pause');
      await safePlayerCall(clickPlayer2, 'pause');

      // Reset and play win sound
      await safePlayerCall(winPlayer, 'pause');
      await safePlayerCall(winPlayer, 'seekTo', 0);
      await safePlayerCall(winPlayer, 'play');

      if (!isDestroyed.current) {
        // Update state
        soundStates.current.win = {
          isPlaying: true,
          lastPlayTime: now,
        };

        // Auto-reset after sound duration
        setTimeout(() => {
          if (!isDestroyed.current) {
            soundStates.current.win.isPlaying = false;
          }
        }, 2000);
      }
    } catch (error) {
      // console.log('Win sound error:', error);
      if (!isDestroyed.current) {
        soundStates.current.win.isPlaying = false;
      }
    }
  };

  const playLoseSound = async () => {
    if (isDestroyed.current) return;

    try {
      const now = Date.now();

      if (!losePlayer) return;

      // Stop any conflicting sounds
      await safePlayerCall(clickPlayer, 'pause');
      await safePlayerCall(clickPlayer2, 'pause');

      // Reset and play lose sound
      await safePlayerCall(losePlayer, 'pause');
      await safePlayerCall(losePlayer, 'seekTo', 0);
      await safePlayerCall(losePlayer, 'play');

      if (!isDestroyed.current) {
        // Update state
        soundStates.current.lose = {
          isPlaying: true,
          lastPlayTime: now,
        };

        // Auto-reset after sound duration
        setTimeout(() => {
          if (!isDestroyed.current) {
            soundStates.current.lose.isPlaying = false;
          }
        }, 2000);
      }
    } catch (error) {
      // console.log('Lose sound error:', error);
      if (!isDestroyed.current) {
        soundStates.current.lose.isPlaying = false;
      }
    }
  };

  // Public API functions
  const playClick = useCallback(async () => {
    if (isDestroyed.current) return;

    if (!isInitialized) {
      soundQueue.current.push({ type: 'click', timestamp: Date.now() });
      return;
    }

    const now = Date.now();
    const lastPlay = soundStates.current.click.lastPlayTime;

    // Debounce rapid clicks
    if (now - lastPlay < 100) {
      return;
    }

    await playClickSound();
  }, [isInitialized]);

  const playWin = useCallback(async () => {
    if (isDestroyed.current) return;

    if (!isInitialized) {
      soundQueue.current.push({ type: 'win', timestamp: Date.now() });
      return;
    }

    const now = Date.now();
    const lastPlay = soundStates.current.win.lastPlayTime;

    // Prevent rapid win sounds
    if (now - lastPlay < 500) {
      return;
    }

    // Add slight delay to ensure separation from other sounds
    setTimeout(async () => {
      if (!isDestroyed.current) {
        await playWinSound();
      }
    }, 150);
  }, [isInitialized]);

  const playLose = useCallback(async () => {
    if (isDestroyed.current) return;

    if (!isInitialized) {
      soundQueue.current.push({ type: 'lose', timestamp: Date.now() });
      return;
    }

    const now = Date.now();
    const lastPlay = soundStates.current.lose.lastPlayTime;

    // Prevent rapid lose sounds
    if (now - lastPlay < 500) {
      return;
    }

    // Add slight delay to ensure separation from other sounds
    setTimeout(async () => {
      if (!isDestroyed.current) {
        await playLoseSound();
      }
    }, 150);
  }, [isInitialized]);

  // Cleanup function
  const stopAllSounds = useCallback(async () => {
    if (isDestroyed.current) return;

    try {
      // Use safe player calls for cleanup
      await Promise.allSettled([
        safePlayerCall(clickPlayer, 'pause'),
        safePlayerCall(clickPlayer2, 'pause'),
        safePlayerCall(winPlayer, 'pause'),
        safePlayerCall(losePlayer, 'pause'),
      ]);

      // Reset all states
      soundStates.current = {
        click: { isPlaying: false, lastPlayTime: 0 },
        win: { isPlaying: false, lastPlayTime: 0 },
        lose: { isPlaying: false, lastPlayTime: 0 },
      };

      // Clear queue
      soundQueue.current = [];
    } catch (error) {
      // console.log('Error stopping sounds:', error);
    }
  }, []);

  return {
    playClick,
    playWin,
    playLose,
    soundsLoaded,
    stopAllSounds,
    isInitialized,
  };
};
