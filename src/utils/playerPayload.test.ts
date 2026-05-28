import { describe, expect, it, beforeEach } from 'vitest';
import { stashPlayerPayload, readPlayerPayload } from './playerPayload';

describe('playerPayload', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns a non-empty token for valid payloads', () => {
    const token = stashPlayerPayload({ url: 'https://vidrock.net/movie/1' });
    expect(token).toMatch(/^[a-z0-9]+$/i);
    expect(token.length).toBeGreaterThan(8);
  });

  it('round-trips a payload through stash and read', () => {
    const payload = {
      url: 'https://vidrock.net/movie/1',
      type: 'embed',
      title: 'Movie Title',
      tmdbId: '12345',
      season: 2,
      episode: 5,
    };
    const token = stashPlayerPayload(payload);
    const recovered = readPlayerPayload(token);
    expect(recovered).toEqual(payload);
  });

  it('returns null for unknown tokens', () => {
    expect(readPlayerPayload('does-not-exist')).toBeNull();
  });

  it('returns null for an empty token', () => {
    expect(readPlayerPayload('')).toBeNull();
  });

  it('isolates different tokens', () => {
    const a = stashPlayerPayload({ url: 'https://vidrock.net/a', title: 'A' });
    const b = stashPlayerPayload({ url: 'https://vidrock.net/b', title: 'B' });
    expect(a).not.toBe(b);
    expect(readPlayerPayload(a)?.title).toBe('A');
    expect(readPlayerPayload(b)?.title).toBe('B');
  });

  it('returns null for malformed payloads', () => {
    sessionStorage.setItem('player-payload:bad', 'not-json');
    expect(readPlayerPayload('bad')).toBeNull();
  });
});
