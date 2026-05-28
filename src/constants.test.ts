import { describe, expect, it } from 'vitest';
import { isAllowedPlayerUrl } from './constants';

describe('isAllowedPlayerUrl', () => {
  it('rejects empty / falsy input', () => {
    expect(isAllowedPlayerUrl('')).toBe(false);
    expect(isAllowedPlayerUrl(null as unknown as string)).toBe(false);
  });

  it('rejects non-http(s) schemes', () => {
    expect(isAllowedPlayerUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedPlayerUrl('data:text/html,<h1>hi</h1>')).toBe(false);
    expect(isAllowedPlayerUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isAllowedPlayerUrl('not a url')).toBe(false);
  });

  it('accepts non-embed direct stream URLs from any host', () => {
    expect(isAllowedPlayerUrl('https://cdn.example.com/movie.mp4')).toBe(true);
    expect(isAllowedPlayerUrl('https://anywhere.tld/playlist.m3u8')).toBe(true);
  });

  describe('embed mode', () => {
    it('accepts vidrock.net', () => {
      expect(isAllowedPlayerUrl('https://vidrock.net/movie/1', 'embed')).toBe(true);
    });

    it('accepts subdomains of vidrock.net', () => {
      expect(isAllowedPlayerUrl('https://www.vidrock.net/movie/1', 'embed')).toBe(true);
      expect(isAllowedPlayerUrl('https://api.vidrock.net/movie/1', 'embed')).toBe(true);
    });

    it('rejects unrelated hosts', () => {
      expect(isAllowedPlayerUrl('https://attacker.tld/phish', 'embed')).toBe(false);
      expect(isAllowedPlayerUrl('https://evil.com', 'embed')).toBe(false);
    });

    it('rejects look-alike domains that merely contain the allowed host', () => {
      // attacker-vidrock.net should NOT pass — only exact host or true subdomain.
      expect(isAllowedPlayerUrl('https://attacker-vidrock.net', 'embed')).toBe(false);
      expect(isAllowedPlayerUrl('https://vidrock.net.attacker.tld', 'embed')).toBe(false);
    });

    it('is case-insensitive for the host', () => {
      expect(isAllowedPlayerUrl('https://VIDROCK.NET/movie/1', 'embed')).toBe(true);
    });
  });
});
