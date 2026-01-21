/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

// Jest setup file

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console.warn to suppress licensing notices during tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn((...args) => {
    // Filter out Velocity BPA licensing notices during tests
    if (args[0]?.includes?.('Velocity BPA Licensing Notice')) {
      return;
    }
    originalWarn.apply(console, args);
  });
});

afterAll(() => {
  console.warn = originalWarn;
});

// Global test utilities
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      testConfig: {
        testnetAddress: string;
        mainnetAddress: string;
      };
    }
  }
}

// Test addresses for XRPL
(global as unknown as { testConfig: object }).testConfig = {
  testnetAddress: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', // Genesis account
  mainnetAddress: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
};

export {};
