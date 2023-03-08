module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  "testMatch": ["<rootDir>/**/*.(spec|test).(ts|tsx)"],
  transform: {
    "\\.(ts|tsx)$": "ts-jest",
  },
  moduleNameMapper: {
    "axios": "<rootDir>/node_modules/axios/dist/axios.js"
  },
  transformIgnorePatterns: ["node_modules/(?!axios)/"]
};
