'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import PaymentModal from './PaymentModal';

interface HeaderProps {
  credits?: number | null;
  isAdmin?: boolean;
  isLandingPage?: boolean;
}

export default function Header({ credits, isAdmin, isLandingPage = false }: HeaderProps) {
  const [user] = useAuthState(auth);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (isLandingPage && !user) {
    // Landing page header - minimal and elegant
    return (
      <header className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Image
                src="/logo.webp"
                alt="Optic Engine"
                width={150}
                height={150}
                className="rounded-lg"
              />
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-stone-600 hover:text-stone-900 transition-colors font-medium">Features</a>
              <a href="#models" className="text-stone-600 hover:text-stone-900 transition-colors font-medium">Models</a>
              <a href="#pricing" className="text-stone-600 hover:text-stone-900 transition-colors font-medium">Pricing</a>
              <a href="#auth" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                Sign In
              </a>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  if (user) {
    // Logged-in header - full functionality (scrolls with page)
    return (
      <>
        <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <Image
                  src="/logo.webp"
                  alt="Optic Engine"
                  width={150}
                  height={150}
                  className="rounded-lg"
                />
              </Link>
              
              <div className="flex items-center space-x-4">
                {credits !== null && (
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-sm font-semibold text-emerald-700">
                      💳 {credits} credits
                    </span>
                  </div>
                              )}
              
              {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                >
                  Get Credits
                </button>
              ) : (
                <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded-xl font-medium">
                  Credits Unavailable
                </div>
              )}

                <nav className="flex items-center space-x-3">
                  <Link 
                    href="/" 
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Create
                  </Link>
                  
                  <Link 
                    href="/gallery" 
                    className="px-4 py-2 bg-stone-50 text-stone-700 font-medium rounded-lg border border-stone-200 hover:bg-stone-100 transition-all duration-200"
                  >
                    Gallery
                  </Link>
                  
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-all duration-200"
                    >
                      Admin
                    </Link>
                  )}
                  
                  <button 
                    onClick={() => auth.signOut()} 
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium rounded-lg transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </header>
        
        <PaymentModal 
          isOpen={showPaymentModal} 
          onClose={() => setShowPaymentModal(false)} 
        />
      </>
    );
  }

  // Default header for other pages
  return (
    <>
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image
                src="/logo.webp"
                alt="Optic Engine"
                width={150}
                height={150}
                className="rounded-lg"
              />
            </Link>
          </div>
        </div>
      </header>
      
      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
    </>
  );
} 