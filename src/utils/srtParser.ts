export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

function parseTimestamp(ts: string): number {
  const [h, m, rest] = ts.trim().split(':');
  const [s, ms] = rest.split(',');
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
}

export function parseSrt(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = content.replace(/\r\n/g, '\n').trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    const timeLineIdx = lines.findIndex(l => l.includes('-->'));
    if (timeLineIdx === -1) continue;

    const [startStr, endStr] = lines[timeLineIdx].split('-->');
    const text = lines.slice(timeLineIdx + 1).join('\n').trim();
    if (!text) continue;

    try {
      cues.push({
        start: parseTimestamp(startStr),
        end: parseTimestamp(endStr),
        text,
      });
    } catch {
      continue;
    }
  }

  return cues;
}
