import { useMemo } from 'react';
import type { SubtitleCue } from '../utils/srtParser';

interface SubtitleOverlayProps {
  cues: SubtitleCue[];
  currentTime: number;
}

export default function SubtitleOverlay({ cues, currentTime }: SubtitleOverlayProps) {
  const activeCues = useMemo(() => {
    return cues.filter(c => currentTime >= c.start && currentTime <= c.end);
  }, [cues, currentTime]);

  if (activeCues.length === 0) return null;

  return (
    <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-20 px-8">
      <div className="bg-black/75 backdrop-blur-sm rounded-lg px-5 py-2.5 max-w-[80%]">
        {activeCues.map((cue, i) => (
          <p
            key={`${cue.start}-${i}`}
            className="text-white text-center text-lg md:text-xl font-medium leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: cue.text
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br/>'),
            }}
          />
        ))}
      </div>
    </div>
  );
}
