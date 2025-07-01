'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

interface SubscriptionData {
  hasSubscription: boolean;
  status: string | null;
  plan: {
    name: string;
    amount: string;
    credits: string;
  } | null;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: any;
  canceledAt?: any;
}

export default function SubscriptionInfo() {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionInfo();
    }
  }, [user]);

  const fetchSubscriptionInfo = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/subscription-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
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
        {subscriptionData?.hasSubscription ? (
          <div className={`p-4 rounded-lg border ${
            subscriptionData.status === 'active' 
              ? 'bg-emerald-50 border-emerald-200' 
              : subscriptionData.status === 'canceled'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-medium ${
                  subscriptionData.status === 'active' 
                    ? 'text-emerald-800' 
                    : subscriptionData.status === 'canceled'
                    ? 'text-orange-800'
                    : 'text-gray-800'
                }`}>
                  {subscriptionData.plan?.name}
                </div>
                <div className={`text-sm ${
                  subscriptionData.status === 'active' 
                    ? 'text-emerald-600' 
                    : subscriptionData.status === 'canceled'
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }`}>
                  {subscriptionData.plan?.amount} • {subscriptionData.plan?.credits}
                </div>
                <div className={`text-xs mt-1 ${
                  subscriptionData.status === 'active' 
                    ? 'text-emerald-600' 
                    : subscriptionData.status === 'canceled'
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }`}>
                  {subscriptionData.status === 'active' && '✅ Active subscription'}
                  {subscriptionData.status === 'canceled' && '⏸️ Canceled - ends at period'}
                  {subscriptionData.status === 'incomplete' && '⚠️ Payment required'}
                  {subscriptionData.status === 'past_due' && '⚠️ Payment overdue'}
                  {!['active', 'canceled', 'incomplete', 'past_due'].includes(subscriptionData.status || '') && 
                    `Status: ${subscriptionData.status}`}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  subscriptionData.status === 'active' 
                    ? 'text-emerald-700' 
                    : subscriptionData.status === 'canceled'
                    ? 'text-orange-700'
                    : 'text-gray-700'
                }`}>
                  {subscriptionData.status === 'active' ? 'Next billing' : 'Ends'}
                </div>
                <div className={`text-xs ${
                  subscriptionData.status === 'active' 
                    ? 'text-emerald-600' 
                    : subscriptionData.status === 'canceled'
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }`}>
                  {subscriptionData.status === 'active' ? 'Auto-renews monthly' : 'Access until period ends'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center text-gray-600">
              <div className="text-lg mb-2">📋</div>
              <div className="font-medium">No Active Subscription</div>
              <div className="text-sm mt-1">Subscribe to get monthly credits and save money!</div>
            </div>
          </div>
        )}

        {subscriptionData?.hasSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">🔧</span>
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Manage Your Subscription</div>
                  <div className="text-blue-700">
                    {subscriptionData.status === 'canceled' 
                      ? 'Reactivate, update payment methods, or download invoices'
                      : 'Cancel, update payment methods, or download invoices'
                    }
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.open('https://billing.stripe.com/p/login/00wfZa1cG6sP0QxfU7bMQ00', '_blank', 'noopener,noreferrer')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Manage
              </button>
            </div>
          </div>
        )}

        <div className="text-xs text-stone-500 text-center">
          Need help? Email{' '}
          <a href="mailto:sage@sagerock.com" className="underline hover:no-underline">
            sage@sagerock.com
          </a>
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