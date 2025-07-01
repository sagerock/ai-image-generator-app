'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

interface Subscription {
  id: string;
  status: string;
  stripeSubscriptionId: string;
  createdAt: any;
  stripeCustomerId: string;
}

export default function SubscriptionInfo() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionInfo();
    }
  }, [user]);

  const fetchSubscriptionInfo = async () => {
    try {
      const token = await user?.getIdToken();
      // For now, we'll just show placeholder info
      // In a real implementation, you'd create an API endpoint to fetch subscription details
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-stone-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-stone-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stone-800">Subscription Status</h3>
        <span className="text-2xl">🎫</span>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-emerald-800">Monthly Credit Plan</div>
              <div className="text-sm text-emerald-600">$10/month • 400 credits monthly</div>
              <div className="text-xs text-emerald-600 mt-1">✅ Active subscription</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-emerald-700">Next billing</div>
              <div className="text-xs text-emerald-600">Auto-renews monthly</div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-amber-500 mr-2">⚠️</span>
            <div className="text-sm text-amber-800">
              <div className="font-medium mb-1">Need to manage your subscription?</div>
              <div className="text-amber-700">
                To cancel, update payment methods, or download invoices, please contact support at{' '}
                <a href="mailto:support@optic-engine.com" className="underline hover:no-underline">
                  support@optic-engine.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-stone-500">
          <p>💡 Subscription benefits:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
            <li>400 credits added monthly</li>
            <li>Unused credits roll over</li>
            <li>Access to all 12 AI models</li>
            <li>Cancel anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 