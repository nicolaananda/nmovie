import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Step = {
  title: string;
  description: string;
  icon: string;
};

const STEPS: Step[] = [
  { title: 'Welcome to NMovie!', description: 'Discover and stream your favorite movies and shows.', icon: '🎬' },
  { title: 'Browse & Search', description: 'Explore trending titles and search by genre or keyword.', icon: '🔎' },
  { title: 'Your Library', description: 'Add titles to your personal library for quick access.', icon: '📚' },
  { title: 'Start Watching', description: 'Stream instantly in high quality with minimal buffering.', icon: '▶️' },
];

export default function Onboarding() {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed');
    // Show onboarding only if user is authenticated and approved and onboarding not completed
    if (user && user.status === 'APPROVED' && !completed) {
      setVisible(true);
    }
  }, [user]);

  const next = () => {
    if (index < STEPS.length - 1) {
      setIndex(index + 1);
    } else {
      complete();
    }
  };

  const skip = () => {
    complete();
  };

  const complete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  const step = STEPS[index];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white/5 border border-white/20 rounded-xl p-6 w-full max-w-xl text-white shadow-2xl backdrop-blur-md animate-fadeIn">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{step.icon}</span>
            <h3 className="text-xl font-semibold">{step.title}</h3>
          </div>
          <button onClick={skip} className="text-white/70 hover:text-white">Skip</button>
        </div>
        <p className="text-sm text-gray-200 mb-6">{step.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-2 w-4 rounded-full ${i <= index ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <button onClick={() => setIndex(index - 1)} className="px-3 py-2 bg-white/10 rounded">Back</button>
            )}
            <button onClick={next} className="px-4 py-2 bg-primary-600 rounded hover:bg-primary-700">{index === STEPS.length - 1 ? 'Finish' : 'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
