import Skeleton from './Skeleton';

// ContentCard skeleton mirrors the actual ContentCard dimensions
export default function ContentCardSkeleton() {
  return (
    <div className="group relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#181818] border border-white/10">
      {/* Poster placeholder */}
      <Skeleton variant="poster" />

      {/* Overlay gradient to simulate content */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Title & meta skeleton */}
      <div className="absolute left-0 right-0 bottom-0 p-2.5 translate-y-4 transition-transform duration-300 group-hover:translate-y-0">
        <Skeleton variant="text" className="h-4 w-3/4 rounded" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton variant="text" className="h-3 w-1/4 rounded" />
        </div>
      </div>
    </div>
  );
}
