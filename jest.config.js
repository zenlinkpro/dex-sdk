const { defaults } = require('jest-config');
const fs = require('fs');
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  moduleFileExtensions: [
    ...defaults.moduleFileExtensions,
    'ts',
    'tsx'
  ],
  modulePathIgnorePatterns: ['<rootDir>/build'].concat(
    fs
      .readdirSync('packages')
      .filter((p) => fs.statSync(`packages/${p}`).isDirectory())
      .map((p) => `<rootDir>/packages/${p}/build`)
  ),
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  preset: 'ts-jest',
  testEnvironment: 'node'
};
