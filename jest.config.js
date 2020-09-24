module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "**/?(*.)+(spec|test).[t]s?(x)"
  ],
  globals: {
    'ts-jest': {
      tsconfig: "<rootDir>/tests/tsconfig.json"
    }
  }
};