import { AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const { currentTheme } = useTheme();

  return (
    <div
      className="p-6 rounded-lg text-center space-y-4"
      style={{ backgroundColor: currentTheme.colors.cardBackground }}
    >
      <AlertCircle
        size={48}
        className="mx-auto"
        style={{ color: currentTheme.colors.error }}
      />
      <div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: currentTheme.colors.text }}
        >
          Something went wrong
        </h3>
        <p style={{ color: currentTheme.colors.textSecondary }}>{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 rounded-lg font-semibold"
          style={{
            backgroundColor: currentTheme.colors.primary,
            color: '#ffffff',
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

