'use client';

import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function Gallery() {
  const { user, loading } = useAuth();

  // Placeholder data - in a real app, this would come from Firebase
  const placeholderImages = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=500&h=500&fit=crop',
      prompt: 'A serene lake surrounded by mountains at sunset',
      model: 'DALL-E 3',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop',
      prompt: 'Mystical forest with glowing fireflies and ancient trees',
      model: 'Stable Diffusion',
      createdAt: '2024-01-14'
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&h=500&fit=crop',
      prompt: 'Cosmic nebula with swirling galaxies and bright stars',
      model: 'Leonardo AI',
      createdAt: '2024-01-13'
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500&h=500&fit=crop',
      prompt: 'Futuristic cityscape with neon lights and flying cars',
      model: 'DALL-E 3',
      createdAt: '2024-01-12'
    },
    {
      id: '5',
      url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500&h=500&fit=crop',
      prompt: 'Tropical paradise with crystal clear waters',
      model: 'Stable Diffusion',
      createdAt: '2024-01-11'
    },
    {
      id: '6',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=500&fit=crop',
      prompt: 'Enchanted garden with magical butterflies and flowers',
      model: 'Leonardo AI',
      createdAt: '2024-01-10'
    }
  ];

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading gallery...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            You need to be signed in to view your gallery.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Gallery
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Browse your AI-generated masterpieces
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/"
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              ← Create New
            </Link>
            <button
              onClick={() => auth.signOut()}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Gallery Content */}
        {placeholderImages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🎨</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              No images yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Start creating amazing AI-generated images and they'll appear here in your personal gallery.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ✨ Create Your First Image
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {placeholderImages.map((image) => (
              <div 
                key={image.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:scale-105"
              >
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <p className="text-gray-800 dark:text-gray-200 text-sm font-medium line-clamp-3 mb-3">
                    "{image.prompt}"
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-medium">
                      {image.model}
                    </span>
                    <span>{image.createdAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <div className="text-3xl mb-4">💡</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Gallery Features Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              We're working on adding image storage, favorites, sharing capabilities, and download options. 
              Currently showing placeholder images for demonstration purposes.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 