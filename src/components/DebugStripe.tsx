'use client';

export default function DebugStripe() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded p-4 text-sm max-w-xs">
      <strong>Debug Info:</strong>
      <br />
      Stripe Key: {key ? `${key.substring(0, 8)}...` : 'NOT FOUND'}
      <br />
      Length: {key?.length || 0}
      <br />
      Type: {typeof key}
    </div>
  );
} 