"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import Header from '@/components/Header';

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
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-600 mx-auto mb-4"></div>
          <p className="text-stone-500 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Sign In Required</h1>
          <p className="text-stone-600 mb-6">You need to be signed in to view your gallery.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-sage-500 hover:bg-sage-600 text-white font-medium rounded-lg transition-colors"
          >
            Back to Home
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

  const loadImageDimensions = (imageUrl: string, imageId: string) => {
    if (imageDimensions[imageId]) return;

    const img = new Image();
    img.onload = () => {
      setImageDimensions(prev => ({
        ...prev,
        [imageId]: { width: img.naturalWidth, height: img.naturalHeight }
      }));
    };
    img.src = imageUrl;
  };

  const downloadImage = (imageUrl: string, prompt: string, model: string) => {
    try {
      const cleanPrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${model}_${cleanPrompt}.webp`;

      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download image:', error);
      window.open(imageUrl, '_blank');
    }
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Gallery</h1>
          <p className="text-stone-600">
            {imagesLoading
              ? 'Loading your images...'
              : `${images.length} image${images.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {imagesLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-600 mx-auto mb-4"></div>
            <p className="text-stone-500 text-sm">Loading your images...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-stone-900 mb-2">Something went wrong</h2>
            <p className="text-stone-600 mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-sage-500 hover:bg-sage-600 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-stone-900 mb-2">No images yet</h2>
            <p className="text-stone-600 mb-6 max-w-md mx-auto">
              Start creating AI-generated images and they'll appear here.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-sage-500 hover:bg-sage-600 text-white font-medium rounded-lg transition-colors"
            >
              Create Your First Image
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image) => {
              const dimensions = imageDimensions[image.id];

              return (
                <div
                  key={image.id}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden group"
                >
                  <div
                    className="aspect-square overflow-hidden bg-stone-100 cursor-pointer relative"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onLoad={() => loadImageDimensions(image.imageUrl, image.id)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>
                  <div className="p-4">
                    <p className="text-stone-700 text-sm line-clamp-2 mb-3">
                      {image.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded font-medium">
                        {image.model}
                      </span>
                      <span>{formatDate(image.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-stone-400">
                        {dimensions ? `${dimensions.width}×${dimensions.height}` : '...'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image.imageUrl, image.prompt, image.model);
                        }}
                        className="text-xs text-sage-500 hover:text-sage-600 font-medium transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-5xl max-h-full w-full h-full flex items-center justify-center">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadImage(selectedImage.imageUrl, selectedImage.prompt, selectedImage.model);
              }}
              className="absolute top-4 right-14 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.prompt}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 rounded-b-lg">
                <p className="text-sm font-medium mb-2">{selectedImage.prompt}</p>
                <div className="flex items-center justify-between text-xs opacity-80">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-white/20 rounded">
                      {selectedImage.model}
                    </span>
                    {imageDimensions[selectedImage.id] && (
                      <span>
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
