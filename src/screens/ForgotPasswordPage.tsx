import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setMessage('If this email is registered, a password reset has been initiated. Please contact admin at reset@ghzm.us for your reset link.');
    } catch (err) {
      // Do not reveal errors to user for security
      setMessage('If this email is registered, a password reset has been initiated.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl text-white">
        <h2 className="text-3xl font-bold text-center mb-6">Forgot Password</h2>
        {message && <div className="bg-white/10 border border-white/20 text-white p-3 rounded mb-4 text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-200 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg">
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-300">
          Remembered your password? <a href="#" onClick={()=>navigate('/login')} className="text-white hover:underline">Login</a>
        </div>
      </div>
    </div>
  );
}
