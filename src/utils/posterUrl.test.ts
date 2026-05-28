import { describe, expect, it } from 'vitest';
import { resolvePosterUrl, extractPosterPath } from './posterUrl';

describe('resolvePosterUrl', () => {
  it('returns null when input is empty', () => {
    expect(resolvePosterUrl(null)).toBeNull();
    expect(resolvePosterUrl(undefined)).toBeNull();
    expect(resolvePosterUrl('')).toBeNull();
  });

  it('passes through absolute https URLs unchanged', () => {
    const url = 'https://image.tmdb.org/t/p/w500/abc.jpg';
    expect(resolvePosterUrl(url)).toBe(url);
  });

  it('passes through absolute http URLs unchanged', () => {
    const url = 'http://example.com/poster.jpg';
    expect(resolvePosterUrl(url)).toBe(url);
  });

  it('prefixes a leading-slash path with the TMDB CDN', () => {
    expect(resolvePosterUrl('/abc.jpg')).toBe(
      'https://image.tmdb.org/t/p/w500/abc.jpg',
    );
  });

  it('prefixes a no-slash path with the TMDB CDN and adds the slash', () => {
    expect(resolvePosterUrl('abc.jpg')).toBe(
      'https://image.tmdb.org/t/p/w500/abc.jpg',
    );
  });

  it('honors the size argument', () => {
    expect(resolvePosterUrl('/abc.jpg', 'w185')).toBe(
      'https://image.tmdb.org/t/p/w185/abc.jpg',
    );
  });

  // Regression test for the "double-prefix" bug that caused broken
  // posters in Continue Watching.
  it('does not double-prefix an already-absolute TMDB URL', () => {
    const url = 'https://image.tmdb.org/t/p/w500/abc.jpg';
    expect(resolvePosterUrl(url)).not.toContain('w500/https://');
    expect(resolvePosterUrl(url)).toBe(url);
  });
});

describe('extractPosterPath', () => {
  it('returns empty string for empty input', () => {
    expect(extractPosterPath(null)).toBe('');
    expect(extractPosterPath(undefined)).toBe('');
    expect(extractPosterPath('')).toBe('');
  });

  it('extracts the path from a full TMDB URL', () => {
    expect(
      extractPosterPath('https://image.tmdb.org/t/p/w500/abc.jpg'),
    ).toBe('/abc.jpg');
  });

  it('handles different sizes', () => {
    expect(
      extractPosterPath('https://image.tmdb.org/t/p/original/abc.jpg'),
    ).toBe('/abc.jpg');
  });

  it('returns the path unchanged when already a path', () => {
    expect(extractPosterPath('/abc.jpg')).toBe('/abc.jpg');
  });

  it('adds a leading slash if missing on a bare path', () => {
    expect(extractPosterPath('abc.jpg')).toBe('/abc.jpg');
  });
});
