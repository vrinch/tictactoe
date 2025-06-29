import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Suitable for utility tests like gameLogic.test.ts
  roots: ['<rootDir>'], // Changed to project root; adjust if tests are in a specific folder
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'], // Matches .test.ts or .spec.ts files
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // Map @/ to /
    'react-native-svg': '<rootDir>/__mocks__/react-native-svg.js',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
};

export default config;
