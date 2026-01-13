'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import ForgotPassword from './ForgotPassword';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        try {
          const token = await userCredential.user.getIdToken();
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              action: 'create-profile',
              userId: userCredential.user.uid,
              email: userCredential.user.email
            })
          });

          if (!response.ok) {
            console.warn('Failed to create user profile, but account was created');
          }
        } catch (profileError) {
          console.warn('Profile creation failed:', profileError);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-stone-900 mb-1">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-sm text-stone-600">
          {isSignUp
            ? '50 free credits to start'
            : 'Sign in to continue'
          }
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
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

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-stone-700" htmlFor="password">
              Password
            </label>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Forgot?
              </button>
            )}
          </div>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="••••••••"
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
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>{isSignUp ? 'Creating...' : 'Signing In...'}</span>
            </div>
          ) : (
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-stone-500">
              {isSignUp ? 'Have an account?' : 'Need an account?'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm"
        >
          {isSignUp ? 'Sign in instead' : 'Create account'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
