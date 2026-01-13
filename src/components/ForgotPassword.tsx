'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Notification from './Notification';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword = ({ onBackToLogin }: ForgotPasswordProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setShowNotification(true);
    } catch (err: any) {
      console.error('Password reset error:', err);

      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many requests. Please try again later.');
          break;
        default:
          setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Notification
          type="success"
          message="Password reset email sent successfully! Check your inbox."
          show={showNotification}
          onClose={() => setShowNotification(false)}
        />
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-stone-900 mb-2">Check Your Email</h2>
            <p className="text-stone-600 mb-4">We've sent a password reset link to:</p>
            <p className="text-emerald-600 font-semibold mb-4">{email}</p>
            <p className="text-sm text-stone-500 mb-6">
              Click the link in the email to reset your password. Check your spam folder if you don't see it.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                Send Another Email
              </button>

              <button
                onClick={onBackToLogin}
                className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Notification
        type="error"
        message={error || ''}
        show={!!error}
        onClose={() => setError(null)}
      />
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-stone-900 mb-1">Reset Password</h2>
          <p className="text-sm text-stone-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="your@email.com"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <span>Send Reset Email</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-stone-500">Remember your password?</span>
            </div>
          </div>

          <button
            onClick={onBackToLogin}
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
