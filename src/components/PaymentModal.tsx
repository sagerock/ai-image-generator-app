'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { CREDIT_PACKAGES, SUBSCRIPTION_PLAN } from '@/lib/stripe-config';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'subscription' | 'credits'>('subscription');

  const handlePayment = async (type: 'subscription' | 'credits', packageId?: string) => {
    if (!user) return;

    // Check if Stripe key is available
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!stripeKey) {
      alert('Payment system is not configured. Please contact support.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          packageId
        })
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-stone-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-stone-800">Get Credits</h2>
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-stone-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex mt-4 bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedTab('subscription')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                selectedTab === 'subscription'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              🔄 Monthly Subscription
            </button>
            <button
              onClick={() => setSelectedTab('credits')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                selectedTab === 'credits'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              💳 One-time Credits
            </button>
          </div>
        </div>

        <div className="p-6">
          {selectedTab === 'subscription' ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-stone-800">Monthly Credit Plan</h3>
                <p className="text-stone-600">Get credits every month with rollover</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                <div className="text-center space-y-4">
                  <div className="text-4xl">🌟</div>
                  <h4 className="text-2xl font-bold text-emerald-800">{SUBSCRIPTION_PLAN.name}</h4>
                  <div className="text-3xl font-bold text-emerald-600">
                    ${SUBSCRIPTION_PLAN.price}/month
                  </div>
                  <div className="text-lg text-emerald-700 font-medium">
                    {SUBSCRIPTION_PLAN.credits} credits per month
                  </div>
                  <p className="text-emerald-600">{SUBSCRIPTION_PLAN.description}</p>
                  
                  <div className="space-y-2 text-sm text-emerald-700">
                    <div className="flex items-center justify-center gap-2">
                      <span>✅</span>
                      <span>Unused credits roll over to next month</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span>✅</span>
                      <span>Cancel anytime</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span>✅</span>
                      <span>Access to all 12 AI models</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePayment('subscription')}
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Start Monthly Plan'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-stone-800">One-time Credit Packages</h3>
                <p className="text-stone-600">Buy credits as you need them</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {CREDIT_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border border-stone-200 rounded-xl p-6 hover:border-emerald-200 hover:shadow-lg transition-all"
                  >
                    <div className="text-center space-y-4">
                      <h4 className="text-xl font-bold text-stone-800">{pkg.name}</h4>
                      <div className="text-2xl font-bold text-emerald-600">
                        ${pkg.price}
                      </div>
                      <div className="text-lg text-stone-700 font-medium">
                        {pkg.credits} credits
                      </div>
                      <p className="text-sm text-stone-600">{pkg.description}</p>
                      
                      <button
                        onClick={() => handlePayment('credits', pkg.id)}
                        disabled={isLoading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-stone-500">
            <p>💳 Secure payment powered by Stripe</p>
            <p>All transactions are encrypted and secure</p>
          </div>
        </div>
      </div>
    </div>
  );
} 