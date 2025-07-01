'use client';

import { useState, useEffect } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validCode, setValidCode] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>('');
  
  // const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams?.get('oobCode');
  const mode = searchParams?.get('mode');

  useEffect(() => {
    if (mode === 'resetPassword' && oobCode) {
      // Verify the password reset code
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setEmail(email);
          setValidCode(true);
        })
        .catch((error) => {
          console.error('Invalid or expired reset code:', error);
          setValidCode(false);
          setError('This password reset link is invalid or has expired.');
        });
    } else {
      setValidCode(false);
      setError('Invalid password reset link.');
    }
  }, [oobCode, mode]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!oobCode) {
      setError('Invalid reset code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      switch (err.code) {
        case 'auth/expired-action-code':
          setError('This password reset link has expired. Please request a new one.');
          break;
        case 'auth/invalid-action-code':
          setError('This password reset link is invalid. Please request a new one.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please choose a stronger password.');
          break;
        default:
          setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state while verifying code
  if (validCode === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Verifying Reset Link
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we verify your password reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Password Reset Complete
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            
            <Link
              href="/"
              className="w-full inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-center"
            >
              🚀 Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Invalid code state
  if (validCode === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              This password reset link is invalid or has expired. Please request a new password reset email.
            </p>
            
            <Link
              href="/"
              className="w-full inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-center"
            >
              🏠 Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Password reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Enter your new password for:
          </p>
          <p className="text-blue-600 dark:text-blue-400 font-semibold">
            {email}
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2" htmlFor="newPassword">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Updating Password...</span>
              </div>
            ) : (
              <span>🔐 Update Password</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-200"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
} 