import { Fragment, useMemo } from 'react';
import type { SubtitleCue } from '../utils/srtParser';

interface SubtitleOverlayProps {
  cues: SubtitleCue[];
  currentTime: number;
  /** Font scale multiplier. 1 = default, range typically 0.7–1.6. */
  fontScale?: number;
}

export default function SubtitleOverlay({
  cues,
  currentTime,
  fontScale = 1,
}: SubtitleOverlayProps) {
  const activeCues = useMemo(() => {
    return cues.filter((c) => currentTime >= c.start && currentTime <= c.end);
  }, [cues, currentTime]);

  if (activeCues.length === 0) return null;

  return (
    <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-20 px-8">
      <div
        className="bg-black/75 backdrop-blur-sm rounded-lg px-5 py-2.5 max-w-[80%]"
        style={{ fontSize: `${fontScale * 1.125}rem` }}
      >
        {activeCues.map((cue, i) => (
          <p
            key={`${cue.start}-${i}`}
            className="text-white text-center font-medium leading-relaxed"
          >
            {/* Render as text + <br>, never as innerHTML — subtitle files
                are user-uploaded and untrusted. JSX auto-escapes. */}
            {cue.text.split('\n').map((line, idx, arr) => (
              <Fragment key={idx}>
                {line}
                {idx < arr.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}
