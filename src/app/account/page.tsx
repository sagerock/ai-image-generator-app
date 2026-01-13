'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Check admin status
  useEffect(() => {
    if (user?.email) {
      const adminEmails = ['admin@example.com', 'sage@sagerock.com'];
      setIsAdmin(adminEmails.includes(user.email));
    }
  }, [user]);

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/user-info', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCredits(data.credits);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading your account...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <Header credits={credits} isAdmin={isAdmin} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Account</h1>
          <p className="text-stone-600">Your account information</p>
        </div>

        <div className="grid gap-6">
          {/* Account Overview */}
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Account Overview</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-stone-500 mb-1">Email</div>
                <div className="font-medium text-stone-900">{user.email}</div>
              </div>
              <div>
                <div className="text-sm text-stone-500 mb-1">Credits Balance</div>
                <div className="font-bold text-2xl text-emerald-600">
                  {credits !== null ? credits : '...'} credits
                </div>
                {credits !== null && credits < 10 && (
                  <div className="mt-2 text-sm text-stone-600">
                    Need more credits? Email{' '}
                    <a href="mailto:sage@sagerock.com" className="text-emerald-600 hover:text-emerald-700 underline">
                      sage@sagerock.com
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Quick Actions</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-4 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors text-left"
              >
                <div className="font-medium text-stone-900 mb-1">Create Images</div>
                <div className="text-sm text-stone-600">Start generating AI art</div>
              </button>

              <button
                onClick={() => router.push('/gallery')}
                className="p-4 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors text-left"
              >
                <div className="font-medium text-stone-900 mb-1">View Gallery</div>
                <div className="text-sm text-stone-600">Browse your creations</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
