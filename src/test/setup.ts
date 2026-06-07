/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';

// Chrome extension API mock
const chromeMock = {
  runtime: {
    sendMessage: vi.fn().mockResolvedValue({}),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  tabs: {
    query: vi.fn().mockResolvedValue([{ id: 1, url: 'https://karararama.yargitay.gov.tr/' }]),
    sendMessage: vi.fn().mockResolvedValue({ ok: true }),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  downloads: {
    download: vi.fn().mockResolvedValue(1),
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    onAlarm: { addListener: vi.fn() },
  },
  notifications: {
    create: vi.fn(),
  },
};

vi.stubGlobal('chrome', chromeMock);
