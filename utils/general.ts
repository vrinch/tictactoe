import { DEFAULT_DURATION } from '@/constants/config';

// Check if username is valid, returns error message or null
export const validateUsername = (value: string): string | null => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Username is required';
  }

  if (trimmedValue.length < 2) {
    return 'Username must be at least 2 characters';
  }

  if (trimmedValue.length > 20) {
    return 'Username must be less than 20 characters';
  }

  // Only allow letters, numbers, underscore, and dash
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(trimmedValue)) {
    return 'Username can only contain letters, numbers, _ and -';
  }

  // Block reserved words
  const blockedWords = ['admin', 'bot', 'test', 'null', 'undefined'];
  const lowercaseValue = trimmedValue.toLowerCase();
  if (blockedWords.some(word => lowercaseValue.includes(word))) {
    return 'Please choose a different username';
  }

  return null;
};

// Format numbers with commas and handle decimals
export const formatNumberInput = (value: string | number): string => {
  let formatted = value.toString().replace(/[^0-9.]/g, '');

  // Fix leading decimal
  if (formatted.startsWith('.')) {
    formatted = '0' + formatted;
  }

  // Remove leading zeros but keep single zero
  if (
    formatted.startsWith('0') &&
    formatted.length > 1 &&
    formatted[1] !== '.'
  ) {
    formatted = formatted.replace(/^0+/, '') || '0';
  }

  if (formatted === '') return '';

  const [integer = '0', decimal = ''] = formatted.split('.');
  const hasDecimal = formatted.includes('.');

  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${hasDecimal ? `.${decimal.replace('.', '')}` : ''}`;
};

// Create array from 1 to number
export const makeArrayFromNumber = (number: number) =>
  new Array(Math.round(number)).fill('').map((_, i) => i + 1);

// Convert number to ordinal (1st, 2nd, 3rd, etc.)
export function formatOrdinal(num: number): string {
  if (isNaN(num) || num < 0 || num > 100_000_000) {
    return '0';
  }

  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  // Handle special cases for 11th, 12th, 13th
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${formatNumberInput(num)}th`;
  }

  switch (lastDigit) {
    case 1:
      return `${formatNumberInput(num)}st`;
    case 2:
      return `${formatNumberInput(num)}nd`;
    case 3:
      return `${formatNumberInput(num)}rd`;
    default:
      return `${formatNumberInput(num)}th`;
  }
}

// Strip emojis from text
export const removeEmojis = (value: string) => {
  return value.replace(
    /<:[^:\s]+:\d+>|<a:[^:\s]+:\d+>|(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|\ufe0f)/g,
    '',
  );
};

// Strip emojis and special characters
export const removeEmojisAndSpecialChars = (value: string) => {
  return value.replace(
    /<:[^:\s]+:\d+>|<a:[^:\s]+:\d+>|(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|\ufe0f)|[^a-zA-Z0-9\s]/g,
    '',
  );
};

// Scale image to fit max size while keeping aspect ratio
export const resizeToMax = (
  width: number,
  height: number,
  defaultSize = 20,
) => {
  const maxDimension = Math.max(width, height);
  if (maxDimension === 0) return { width: 0, height: 0 };

  const scale = defaultSize / maxDimension;

  return {
    width: width * scale,
    height: height * scale,
  };
};

// Fit image within max width and height bounds
export const resizeToMaxHeight = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) => {
  if (width === 0 || height === 0) return { width: 0, height: 0 };
  const aspect = width / height;
  const scaledHeight = maxWidth / aspect;
  if (scaledHeight <= maxHeight) {
    return { width: maxWidth, height: scaledHeight };
  } else {
    return { width: maxHeight * aspect, height: maxHeight };
  }
};

// Delay execution for given milliseconds
export const sleep = (ms: number = DEFAULT_DURATION) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Make hex color lighter by blend amount
export const lightenHex = (hex: string, amount = 0.5): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));
  return (
    '#' +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
};

// Array [0,1,2,3,4,5,6,7,8,9] for digit animations
export const numberRange = [...Array(10).keys()];

// Stagger delay for rolling number animations
export const STAGGER_DELAY = 50;
