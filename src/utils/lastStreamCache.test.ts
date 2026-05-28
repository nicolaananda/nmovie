import { describe, expect, it, beforeEach } from 'vitest';
import { rememberLastStream, recallLastStream } from './lastStreamCache';

describe('lastStreamCache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing has been remembered', () => {
    expect(recallLastStream('123')).toBeNull();
  });

  it('round-trips a remembered payload', () => {
    rememberLastStream({
      url: 'https://vidrock.net/movie/1',
      type: 'embed',
      tmdbId: '1',
      title: 'A',
    });
    const recalled = recallLastStream('1');
    expect(recalled?.url).toBe('https://vidrock.net/movie/1');
    expect(recalled?.title).toBe('A');
  });

  it('keys by tmdbId + season + episode', () => {
    rememberLastStream({ url: 'https://x/s1e1', tmdbId: '1', season: 1, episode: 1 });
    rememberLastStream({ url: 'https://x/s1e2', tmdbId: '1', season: 1, episode: 2 });
    expect(recallLastStream('1', 1, 1)?.url).toBe('https://x/s1e1');
    expect(recallLastStream('1', 1, 2)?.url).toBe('https://x/s1e2');
    expect(recallLastStream('1', 2, 1)).toBeNull();
  });

  it('expires entries older than the TTL', () => {
    rememberLastStream({ url: 'https://x', tmdbId: '1' });
    // Manually rewrite the savedAt timestamp to far in the past.
    const raw = JSON.parse(localStorage.getItem('last-stream-cache') ?? '{}');
    const key = '1:0:0';
    raw[key].savedAt = Date.now() - 1000 * 60 * 60 * 24; // 24h ago
    localStorage.setItem('last-stream-cache', JSON.stringify(raw));
    expect(recallLastStream('1')).toBeNull();
  });

  it('does nothing when tmdbId is missing', () => {
    rememberLastStream({ url: 'https://x' } as { url: string });
    // Cache should be empty.
    expect(localStorage.getItem('last-stream-cache')).toBeNull();
  });
});
