export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

/**
 * Parse a single timestamp. Accepts both SRT (`HH:MM:SS,mmm`) and VTT
 * (`HH:MM:SS.mmm` or `MM:SS.mmm`) shapes — the differences are minor
 * and conflating them keeps the call sites simpler.
 */
function parseTimestamp(ts: string): number {
  const trimmed = ts.trim().replace(',', '.');
  const parts = trimmed.split(':');
  let h = 0;
  let m = 0;
  let s = 0;
  if (parts.length === 3) {
    [h, m] = [parseInt(parts[0]), parseInt(parts[1])];
    s = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    m = parseInt(parts[0]);
    s = parseFloat(parts[1]);
  } else {
    s = parseFloat(parts[0]);
  }
  return h * 3600 + m * 60 + s;
}

function parseGeneric(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const text = content.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');

  // Drop a leading WEBVTT header block if present (VTT files start with
  // "WEBVTT" optionally followed by metadata).
  const stripped = text.replace(/^WEBVTT[^\n]*\n(?:[^\n]*\n)*?(?=\n)/i, '').trim();

  const blocks = stripped.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split('\n');
    const timeLineIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeLineIdx === -1) continue;

    // Strip trailing cue settings on VTT lines (e.g. "00:00:00.000 --> 00:00:02.000 line:90% align:middle")
    const timeLine = lines[timeLineIdx].split(/\s+(?=[A-Za-z]+:)/)[0];
    const [startStr, endStr] = timeLine.split('-->');
    if (!startStr || !endStr) continue;

    const body = lines
      .slice(timeLineIdx + 1)
      .join('\n')
      .trim();
    if (!body) continue;

    try {
      cues.push({
        start: parseTimestamp(startStr),
        end: parseTimestamp(endStr),
        text: body,
      });
    } catch {
      continue;
    }
  }

  return cues;
}

export function parseSrt(content: string): SubtitleCue[] {
  return parseGeneric(content);
}

/** Alias for clarity at call sites. */
export function parseVtt(content: string): SubtitleCue[] {
  return parseGeneric(content);
}

/**
 * Best-effort auto-detect: VTT files start with the magic "WEBVTT"
 * header. Anything else falls back to SRT-style parsing, which also
 * tolerates VTT-style timestamps thanks to the unified parser above.
 */
export function parseSubtitle(content: string): SubtitleCue[] {
  return parseGeneric(content);
}

/** Returns a new array with every cue shifted by `offsetSeconds`. */
export function shiftCues(cues: SubtitleCue[], offsetSeconds: number): SubtitleCue[] {
  if (!offsetSeconds) return cues;
  return cues.map((c) => ({
    ...c,
    start: Math.max(0, c.start + offsetSeconds),
    end: Math.max(0, c.end + offsetSeconds),
  }));
}
