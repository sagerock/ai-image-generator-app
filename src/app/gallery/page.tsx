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
  dimensions?: { width: number; height: number };
}

export default function Gallery() {
  const { user, loading } = useAuth();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});

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

  // Load image dimensions
  const loadImageDimensions = (imageUrl: string, imageId: string) => {
    if (imageDimensions[imageId]) return; // Already loaded

    const img = new Image();
    img.onload = () => {
      setImageDimensions(prev => ({
        ...prev,
        [imageId]: { width: img.naturalWidth, height: img.naturalHeight }
      }));
    };
    img.src = imageUrl;
  };

  // Download image function
  const downloadImage = (imageUrl: string, prompt: string, model: string) => {
    try {
      // Create a clean filename
      const cleanPrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${model}_${cleanPrompt}.webp`;
      
      // Use a simple link download approach that works with Firebase Storage
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Temporarily add to DOM and click
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download image:', error);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  // Close modal function
  const closeModal = () => {
    setSelectedImage(null);
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
            {images.map((image) => {
              const dimensions = imageDimensions[image.id];
              
              return (
                <div 
                  key={image.id} 
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <div 
                    className="aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 cursor-pointer relative"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.prompt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      onLoad={() => loadImageDimensions(image.imageUrl, image.id)}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <div className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm font-medium">
                        Click to view full size
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-800 dark:text-gray-200 text-sm font-medium line-clamp-3 mb-3">
                      "{image.prompt}"
                    </p>
                    <div className="space-y-2">
                      {/* Model and Date */}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-medium">
                          {image.model.toUpperCase()}
                        </span>
                        <span>{formatDate(image.createdAt)}</span>
                      </div>
                      
                      {/* Dimensions and Download */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {dimensions ? (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              {dimensions.width} × {dimensions.height}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse">
                              Loading...
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(image.imageUrl, image.prompt, image.model);
                          }}
                          className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Download image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Full-size Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Download button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadImage(selectedImage.imageUrl, selectedImage.prompt, selectedImage.model);
              }}
              className="absolute top-4 right-16 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
              title="Download"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.prompt}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
              
              {/* Image info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-6 rounded-b-lg">
                                            <p className="text-lg font-medium mb-2">&quot;{selectedImage.prompt}&quot;</p>
                <div className="flex items-center justify-between text-sm opacity-90">
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 bg-white/20 rounded-full">
                      {selectedImage.model.toUpperCase()}
                    </span>
                    {imageDimensions[selectedImage.id] && (
                      <span className="px-3 py-1 bg-white/20 rounded-full">
                        {imageDimensions[selectedImage.id].width} × {imageDimensions[selectedImage.id].height}
                      </span>
                    )}
                  </div>
                  <span>{formatDate(selectedImage.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 