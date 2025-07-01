'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: any;
  currentPeriodEnd: any;
  stripeSubscriptionId: string;
}

export default function SubscriptionManager() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/user-info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      // Note: We'd need to modify the user-info API to include subscription data
      // For now, this is a placeholder
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;
    
    setPortalLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        if (response.status === 404) {
          alert('No active subscription found. Subscribe first to manage your plan!');
        } else {
          alert('Error opening customer portal. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Error opening customer portal. Please try again.');
    } finally {
      setPortalLoading(false);
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
        <h3 className="text-lg font-semibold text-stone-800">Subscription Management</h3>
        <span className="text-2xl">🎫</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
          <div>
            <div className="font-medium text-stone-800">Monthly Credit Plan</div>
            <div className="text-sm text-stone-600">
              Manage your subscription, update payment method, or cancel
            </div>
          </div>
          <button
            onClick={openCustomerPortal}
            disabled={portalLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {portalLoading ? 'Loading...' : 'Manage'}
          </button>
        </div>

        <div className="text-sm text-stone-500">
          <p>💡 The customer portal allows you to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
            <li>Update your payment method</li>
            <li>Download invoices</li>
            <li>Cancel your subscription</li>
            <li>View billing history</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 