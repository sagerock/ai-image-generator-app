'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

interface HeaderProps {
  credits?: number | null;
  isAdmin?: boolean;
  isLandingPage?: boolean;
}

function Logo() {
  return (
    <img
      src="https://sagerock.com/wp-content/uploads/2024/05/sagerocklogo2024-300x70.png"
      alt="SageRock"
      className="h-8 w-auto"
    />
  );
}

export default function Header({ credits, isAdmin, isLandingPage = false }: HeaderProps) {
  const [user] = useAuthState(auth);

  if (isLandingPage && !user) {
    return (
      <header className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">
                Features
              </a>
              <a href="#models" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">
                Models
              </a>
              <a href="#auth" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
                Sign In
              </a>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  if (user) {
    return (
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="hover:opacity-70 transition-opacity">
              <Logo />
            </Link>

            <div className="flex items-center space-x-3">
              {credits !== null && (
                <span className="text-sm font-medium text-stone-600">
                  {credits} credits
                </span>
              )}

              <Link
                href="/"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Create
              </Link>

              <Link
                href="/gallery"
                className="px-3 py-1.5 text-stone-600 hover:text-stone-900 text-sm font-medium transition-colors"
              >
                Gallery
              </Link>

              <Link
                href="/account"
                className="px-3 py-1.5 text-stone-600 hover:text-stone-900 text-sm font-medium transition-colors"
              >
                Account
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 text-amber-700 hover:text-amber-800 text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
              )}

              <button
                onClick={() => auth.signOut()}
                className="px-3 py-1.5 text-stone-500 hover:text-stone-700 text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Logo />
          </Link>
        </div>
      </div>
    </header>
  );
}
