import { describe, expect, it } from 'vitest';
import { parseSrt, parseVtt, parseSubtitle, shiftCues } from './srtParser';

const SRT = `1
00:00:01,000 --> 00:00:03,000
Hello world

2
00:00:04,500 --> 00:00:06,000
Second cue
with two lines

3
00:00:10,000 --> 00:00:11,000

`; // last block has no body, must be skipped

const VTT = `WEBVTT
Kind: captions
Language: en

1
00:00:01.000 --> 00:00:03.000 line:90% align:middle
Hello world

2
00:00:04.500 --> 00:00:06.000
Second cue`;

describe('parseSrt', () => {
  it('parses basic SRT cues', () => {
    const cues = parseSrt(SRT);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ start: 1, end: 3, text: 'Hello world' });
    expect(cues[1].text).toBe('Second cue\nwith two lines');
  });

  it('skips blocks with no body text', () => {
    const cues = parseSrt(SRT);
    expect(cues.find((c) => c.start === 10)).toBeUndefined();
  });

  it('handles \\r\\n line endings', () => {
    const crlf = SRT.replace(/\n/g, '\r\n');
    const cues = parseSrt(crlf);
    expect(cues).toHaveLength(2);
  });
});

describe('parseVtt', () => {
  it('strips the WEBVTT header and parses cues', () => {
    const cues = parseVtt(VTT);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ start: 1, end: 3, text: 'Hello world' });
  });

  it('strips trailing cue settings on the time line', () => {
    const cues = parseVtt(VTT);
    expect(cues[0].end).toBe(3);
  });

  it('parses milliseconds correctly with the dot separator', () => {
    const cues = parseVtt(VTT);
    expect(cues[1].start).toBeCloseTo(4.5);
  });
});

describe('parseSubtitle (auto)', () => {
  it('handles SRT input', () => {
    expect(parseSubtitle(SRT)).toHaveLength(2);
  });

  it('handles VTT input', () => {
    expect(parseSubtitle(VTT)).toHaveLength(2);
  });
});

describe('shiftCues', () => {
  it('returns the original array when offset is 0', () => {
    const cues = parseSrt(SRT);
    expect(shiftCues(cues, 0)).toBe(cues);
  });

  it('shifts every cue by the given offset', () => {
    const cues = parseSrt(SRT);
    const shifted = shiftCues(cues, 1.5);
    expect(shifted[0].start).toBe(2.5);
    expect(shifted[0].end).toBe(4.5);
    expect(shifted[1].start).toBe(6);
    expect(shifted[1].end).toBe(7.5);
  });

  it('clamps negative timestamps to 0', () => {
    const cues = parseSrt(SRT);
    const shifted = shiftCues(cues, -10);
    expect(shifted[0].start).toBe(0);
    expect(shifted[0].end).toBe(0);
  });
});
