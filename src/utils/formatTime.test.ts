import { describe, expect, it } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('returns 0:00 for zero', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('returns 0:00 for negative numbers', () => {
    expect(formatTime(-5)).toBe('0:00');
  });

  it('returns 0:00 for non-finite numbers', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
  });

  it('formats seconds under a minute', () => {
    expect(formatTime(7)).toBe('0:07');
    expect(formatTime(45)).toBe('0:45');
  });

  it('formats minutes:seconds', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(125)).toBe('2:05');
    expect(formatTime(599)).toBe('9:59');
  });

  it('switches to H:MM:SS at the 1-hour mark', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(7325)).toBe('2:02:05');
  });

  it('floors fractional seconds', () => {
    expect(formatTime(7.9)).toBe('0:07');
  });
});
