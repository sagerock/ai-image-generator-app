import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

// Client-side Stripe instance
export const getStripe = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
  }
  return loadStripe(key);
};

// Credit packages for one-time purchases
export const CREDIT_PACKAGES = [
  {
    id: 'credits_100',
    name: '100 Credits',
    credits: 100,
    price: 10, // $10
    description: 'Perfect for regular users'
  },
  {
    id: 'credits_250',
    name: '250 Credits',
    credits: 250,
    price: 20, // $20 (20% discount)
    description: 'Great value pack'
  },
  {
    id: 'credits_500',
    name: '500 Credits',
    credits: 500,
    price: 35, // $35 (30% discount)
    description: 'Best value for power users'
  }
];

// Subscription plan
export const SUBSCRIPTION_PLAN = {
  id: 'monthly_400_credits',
  name: 'Monthly Credit Plan',
  credits: 400,
  price: 10, // $10/month
  description: '400 credits per month + rollover unused credits'
}; 