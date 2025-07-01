'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give some time for webhook to process
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header credits={null} isAdmin={false} />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center">
          {isLoading ? (
            <div className="space-y-4">
              <div className="text-6xl">⏳</div>
              <h1 className="text-3xl font-bold text-stone-800">
                Processing Payment...
              </h1>
              <p className="text-stone-600">
                We're adding your credits to your account. This usually takes a few seconds.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-6xl">✅</div>
              <h1 className="text-3xl font-bold text-stone-800">
                Payment Successful!
              </h1>
              <p className="text-lg text-stone-600">
                Your credits have been added to your account. You can now start creating amazing images!
              </p>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <div className="text-emerald-700">
                  <div className="text-2xl mb-2">🎉</div>
                  <h2 className="text-xl font-semibold mb-2">Welcome to Optic Engine!</h2>
                  <p>Your credits are ready to use. Start generating incredible AI images with our 12 powerful models.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                >
                  Start Creating Images
                </Link>
                <Link
                  href="/gallery"
                  className="px-6 py-3 border border-stone-300 hover:border-stone-400 text-stone-700 rounded-xl font-medium transition-colors"
                >
                  View Gallery
                </Link>
              </div>

              {sessionId && (
                <p className="text-sm text-stone-500 mt-8">
                  Session ID: {sessionId}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 