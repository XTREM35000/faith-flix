/* eslint-disable @typescript-eslint/no-explicit-any */
import { canCallFB, safeGetLoginStatus } from '@/lib/facebook';

describe('Facebook guard', () => {
  const originalLocation = window.location;

  afterEach(() => {
    (window as any).location = originalLocation;
    delete (window as any).FB;
  });

  test('does not call FB.getLoginStatus on http even if FB exists', () => {
    // mock window.location to be http
    delete (window as any).location;
    (window as any).location = { protocol: 'http:', hostname: 'example.com' };

    // mock FB
    (window as any).FB = { getLoginStatus: vi.fn() };

    expect(canCallFB()).toBe(false);
    expect(safeGetLoginStatus()).toBe(false);
    expect((window as any).FB.getLoginStatus).not.toHaveBeenCalled();
  });

  test('calls FB.getLoginStatus on https', () => {
    delete (window as any).location;
    (window as any).location = { protocol: 'https:', hostname: 'example.com' };
    // mock FB
    (window as any).FB = { getLoginStatus: vi.fn() };

    expect(canCallFB()).toBe(true);
    expect(safeGetLoginStatus()).toBe(true);
    expect((window as any).FB.getLoginStatus).toHaveBeenCalled();
  });
});
