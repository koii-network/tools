module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  "testMatch": ["<rootDir>/**/*.(spec|test).(ts|tsx)"],
  setupFiles: ["dotenv/config"],
  transform: {
    "\\.(ts|tsx|js|jsx)$": "ts-jest",
    // [`^($axios).+\\.js$`]: 'babel-jest',
  },
  // transformIgnorePatterns: ["node_modules/(?!axios)"],
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
  transformIgnorePatterns: ["node_modules/(?!axios)/"]
};
