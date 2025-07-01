'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function PaymentCanceled() {
  return (
    <div className="min-h-screen bg-white">
      <Header credits={null} isAdmin={false} />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <div className="text-6xl">❌</div>
          <h1 className="text-3xl font-bold text-stone-800">
            Payment Canceled
          </h1>
          <p className="text-lg text-stone-600">
            No worries! Your payment was canceled and no charges were made.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="text-amber-700">
              <div className="text-2xl mb-2">💡</div>
              <h2 className="text-xl font-semibold mb-2">Ready to try again?</h2>
              <p>You can still get credits to start creating amazing AI images. We have flexible options for everyone!</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#pricing"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
            >
              View Pricing
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-stone-300 hover:border-stone-400 text-stone-700 rounded-xl font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 