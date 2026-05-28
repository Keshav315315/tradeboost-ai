module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: ['**/src/__tests__/**/*.test.js'],
  verbose: true
}
