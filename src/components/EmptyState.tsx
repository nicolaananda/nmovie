import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="glass-panel p-8 md:p-12 rounded-2xl max-w-xl w-full text-center">
        <div className="flex items-center justify-center text-4xl text-white/80 mb-4">
          <Icon size={54} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 mb-4">{description}</p>
        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="inline-block mt-2 px-5 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
