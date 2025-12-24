import { useNavigate } from 'react-router-dom';
import { StreamingContent } from '../types/metadata';
import { Star } from 'lucide-react';

interface ContentCardProps {
  content: StreamingContent;
}

export default function ContentCard({ content }: ContentCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/metadata/${content.type}/${content.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative w-full aspect-[2/3] cursor-pointer rounded-xl overflow-hidden bg-[#181818] shadow-lg transition-all duration-500 hover:shadow-[0_0_30px_rgba(114,14,30,0.6)] hover:scale-105 hover:z-50"
    >
      {/* Background Image */}
      {content.poster ? (
        <img
          src={content.poster}
          alt={content.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#1f1f1f]">
          <span className="text-gray-500 font-medium">No Image</span>
        </div>
      )}

      {/* Dark Gradient Overlay (Always present but stronger at bottom) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

      {/* Content Container - Slides up on hover */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 translate-y-4 transition-transform duration-300 group-hover:translate-y-0">
        <div className="space-y-2 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">

          {/* Title */}
          <h3 className="font-black text-lg text-white leading-tight drop-shadow-md line-clamp-2">
            {content.name}
          </h3>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-xs font-medium text-gray-200">
            {(content.year || content.released) ? (
              <span className="text-white/90">
                {content.year || content.released?.substring(0, 4)}
              </span>
            ) : null}

            {content.imdbRating && (
              <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[#46d369]">
                <Star size={10} className="fill-current" />
                <span>{content.imdbRating}</span>
              </div>
            )}

            <span className="border border-white/30 px-1 py-0.5 rounded text-[10px] bg-white/10 backdrop-blur-md">
              HD
            </span>
          </div>

          {/* Action Button Hint */}
          <div className="pt-2">
            <button className="w-full py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-gray-200 transition-colors shadow-lg">
              Watch Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

