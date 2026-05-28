import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { ADMIN_EMAIL } from '../constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch {
      // Always show the same UI to avoid leaking which emails are registered.
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl text-white">
        <h2 className="text-3xl font-bold text-center mb-2">Forgot Password</h2>
        <p className="text-gray-400 text-center text-sm mb-6">
          We don't send emails automatically. Submit your email and the admin
          will share a reset link with you manually.
        </p>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-primary-900/20 border border-primary-500/30 p-4">
              <h3 className="font-semibold text-white mb-1">Request received</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                We've notified the admin. They'll reach out via the email you
                registered with. If it's urgent, you can also contact them
                directly.
              </p>
            </div>
            <a
              href={`mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
                'Password reset · ' + email,
              )}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium"
            >
              <Mail size={16} />
              Email admin · {ADMIN_EMAIL}
            </a>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white text-sm"
            >
              <ArrowLeft size={14} />
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-200 text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg"
            >
              {loading ? 'Submitting...' : 'Submit request'}
            </button>
            <div className="text-center text-sm text-gray-400">
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-white hover:underline"
              >
                Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
