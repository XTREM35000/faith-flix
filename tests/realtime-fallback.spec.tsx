/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useUnreadNotifications from '../src/hooks/useUnreadNotifications';
import { supabase } from '../src/integrations/supabase/client';

// Mock supabase module
vi.mock('../src/integrations/supabase/client', () => {
  const fromMock = vi.fn(() => ({ select: vi.fn().mockResolvedValue({ count: 0 }) }));
  const channelObj = {
    on: vi.fn(() => { throw new Error('realtime unavailable'); }),
    subscribe: vi.fn(() => Promise.reject(new Error('subscribe failed'))),
  };
  return {
    supabase: {
      from: fromMock,
      channel: vi.fn(() => channelObj),
      removeChannel: vi.fn(),
    }
  };
});

function TestHarness() {
  const { unreadCount } = useUnreadNotifications();
  return <div data-testid="count">{unreadCount}</div>;
}

describe('useUnreadNotifications realtime fallback', () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
    vi.resetAllMocks();
  });

  it('falls back to polling when realtime subscribe fails', async () => {
    let root: any;

    act(() => {
      root = createRoot(container!);
      root.render(<TestHarness />);
    });

    // Advance timers to allow polling to run
    act(() => {
      vi.advanceTimersByTime(31 * 1000);
    });

    // Ensure the polling code called supabase.from at least once
    expect((supabase as any).from).toHaveBeenCalled();

    if (root) {
      act(() => {
        root.unmount();
      });
    }
  });
});