import { Dimensions, Platform } from 'react-native';

// Device screen dimensions
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

// Platform detection helpers
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Game board constants
export const BOARD_SIZE = 3;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

// Default animation timing
export const DEFAULT_DURATION = 1000; // 1 second
