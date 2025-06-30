"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

interface GeneratedImage {
  id: string;
  prompt: string;
  model: string;
  imageUrl: string;
  createdAt: string;
  size: string;
  quality: string;
}

export default function Gallery() {
  const { user, loading } = useAuth();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's images
  useEffect(() => {
    const fetchImages = async () => {
      if (!user) {
        setImagesLoading(false);
        return;
      }

      try {
        setImagesLoading(true);
        setError(null);

        const idToken = await user.getIdToken();
        const response = await fetch('/api/gallery', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }

        const data = await response.json();
        setImages(data.images || []);
      } catch (error) {
        console.error('Error fetching images:', error);
        setError('Failed to load your images. Please try again.');
      } finally {
        setImagesLoading(false);
      }
    };

    fetchImages();
  }, [user]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
              {imagesLoading 
                ? 'Loading your AI-generated masterpieces...' 
                : `${images.length} AI-generated masterpiece${images.length !== 1 ? 's' : ''}`
              }
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
        {imagesLoading ? (
          <div className="text-center py-16">
            <div className="animate-pulse mb-6">
              <div className="w-24 h-24 bg-blue-200 dark:bg-blue-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="text-2xl">🎨</div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Loading your images...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🔄 Try Again
            </button>
          </div>
        ) : images.length === 0 ? (
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
            {images.map((image) => (
              <div 
                key={image.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:scale-105"
              >
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <img
                    src={image.imageUrl}
                    alt={image.prompt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <p className="text-gray-800 dark:text-gray-200 text-sm font-medium line-clamp-3 mb-3">
                    "{image.prompt}"
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-medium">
                      {image.model.toUpperCase()}
                    </span>
                    <span>{formatDate(image.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        {images.length > 0 && (
          <div className="mt-16 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
              <div className="text-3xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Your Creative Journey
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                You've created {images.length} unique AI-generated image{images.length !== 1 ? 's' : ''}! 
                Each one is stored securely in your personal gallery.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 