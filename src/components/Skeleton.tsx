import React from 'react';

type SkeletonVariant = 'text' | 'card' | 'poster' | 'circle' | 'row';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  count?: number;
}

/**
 * Reusable animated skeleton for loading states.
 * Uses Tailwind classes for pulse animation and subtle grayscale.
 */
const Skeleton: React.FC<SkeletonProps> = ({ variant = 'text', className = '', count = 1 }) => {
  const items = Array.from({ length: Math.max(1, count) });

  const base = 'animate-pulse bg-white/10 rounded-lg';

  return (
    <>
      {items.map((_, idx) => {
        const key = `${variant}-${idx}`;
        switch (variant) {
          case 'poster':
            return (
              <div
                key={key}
                className={`${base} w-full aspect-[2/3] md:aspect-[2/3] rounded-xl ${className}`}
              />
            );
          case 'circle':
            return (
              <div
                key={key}
                className={`${base} w-12 h-12 rounded-full ${className}`}
              />
            );
          case 'row':
            return (
              <div key={key} className={`h-4 ${base} rounded ${className}`} />
            );
          case 'card':
            return (
              <div key={key} className={`w-full h-40 rounded-xl ${base} ${className}`} />
            );
          case 'text':
          default:
            return (
              <div key={key} className={`h-5 w-full rounded ${base} ${className}`} />
            );
        }
      })}
    </>
  );
};

export default Skeleton;
