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
  tags?: string[];
}

export default function Gallery() {
  const { user, loading } = useAuth();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedFilterTags, setSelectedFilterTags] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<string[]>([]);
  const [editingTagsFor, setEditingTagsFor] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [savingTags, setSavingTags] = useState(false);

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
        const fetchedImages = data.images || [];
        setImages(fetchedImages);

        // Extract unique tags from all images
        const tags = new Set<string>();
        fetchedImages.forEach((img: GeneratedImage) => {
          img.tags?.forEach(tag => tags.add(tag));
        });
        setAllTags(Array.from(tags).sort());
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

  const deleteImage = async (imageId: string) => {
    if (!user) return;

    setDeletingImages(prev => new Set(prev).add(imageId));
    setShowDeleteConfirm(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/gallery', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Remove from local state
      setImages(prev => prev.filter(img => img.id !== imageId));

      // Close modal if the deleted image was selected
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image. Please try again.');
    } finally {
      setDeletingImages(prev => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  const saveTags = async (imageId: string) => {
    if (!user) return;

    setSavingTags(true);

    try {
      const idToken = await user.getIdToken();
      const tags = tagInput
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      const response = await fetch('/api/gallery', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId, tags }),
      });

      if (!response.ok) {
        throw new Error('Failed to save tags');
      }

      const data = await response.json();

      // Update local state with new tags
      setImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, tags: data.tags } : img
      ));

      // Update allTags with any new tags
      setAllTags(prev => {
        const newTags = new Set(prev);
        data.tags.forEach((tag: string) => newTags.add(tag));
        return Array.from(newTags).sort();
      });

      // Close the modal
      setEditingTagsFor(null);
      setTagInput('');
    } catch (error) {
      console.error('Error saving tags:', error);
      setError('Failed to save tags. Please try again.');
    } finally {
      setSavingTags(false);
    }
  };

  const openTagEditor = (image: GeneratedImage) => {
    setEditingTagsFor(image.id);
    setTagInput(image.tags?.join(', ') || '');
  };

  const toggleFilterTag = (tag: string) => {
    setSelectedFilterTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const filteredImages = images.filter(img => {
    if (selectedFilterTags.size === 0) return true;
    return img.tags?.some(tag => selectedFilterTags.has(tag)) ?? false;
  });

  return (
    <main className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Gallery</h1>
          <p className="text-stone-600">
            {imagesLoading
              ? 'Loading your images...'
              : selectedFilterTags.size > 0
                ? `${filteredImages.length} of ${images.length} image${images.length !== 1 ? 's' : ''}`
                : `${images.length} image${images.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Tag Filter Bar */}
        {allTags.length > 0 && !imagesLoading && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-stone-500 mr-2">Filter by tag:</span>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleFilterTag(tag)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedFilterTags.has(tag)
                      ? 'bg-sage-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedFilterTags.size > 0 && (
                <button
                  onClick={() => setSelectedFilterTags(new Set())}
                  className="px-3 py-1 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

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
        ) : filteredImages.length === 0 && selectedFilterTags.size > 0 ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-stone-900 mb-2">No matching images</h2>
            <p className="text-stone-600 mb-6 max-w-md mx-auto">
              No images found with the selected tags.
            </p>
            <button
              onClick={() => setSelectedFilterTags(new Set())}
              className="px-6 py-3 bg-sage-500 hover:bg-sage-600 text-white font-medium rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredImages.map((image) => {
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
                    <p className="text-stone-700 text-sm line-clamp-2 mb-2">
                      {image.prompt}
                    </p>
                    {image.tags && image.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {image.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-sage-100 text-sage-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {image.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-stone-400 text-xs">
                            +{image.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTagEditor(image);
                          }}
                          className="text-xs text-stone-500 hover:text-stone-700 font-medium transition-colors"
                        >
                          Tags
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(image.imageUrl, image.prompt, image.model);
                          }}
                          className="text-xs text-sage-500 hover:text-sage-600 font-medium transition-colors"
                        >
                          Download
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(image.id);
                          }}
                          disabled={deletingImages.has(image.id)}
                          className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
                        >
                          {deletingImages.has(image.id) ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tag Editing Modal */}
      {editingTagsFor && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setEditingTagsFor(null);
            setTagInput('');
          }}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Edit Tags</h3>
            <p className="text-stone-600 text-sm mb-4">
              Add tags separated by commas (e.g., landscape, portrait, dark)
            </p>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="landscape, portrait, abstract..."
              className="w-full p-3 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !savingTags) {
                  saveTags(editingTagsFor);
                }
              }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setEditingTagsFor(null);
                  setTagInput('');
                }}
                disabled={savingTags}
                className="px-4 py-2 text-stone-600 hover:text-stone-800 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => saveTags(editingTagsFor)}
                disabled={savingTags}
                className="px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {savingTags ? 'Saving...' : 'Save Tags'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Delete Image?</h3>
            <p className="text-stone-600 text-sm mb-6">
              This action cannot be undone. The image will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-stone-600 hover:text-stone-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteImage(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(selectedImage.id);
              }}
              disabled={deletingImages.has(selectedImage.id)}
              className="absolute top-4 right-24 z-10 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-2 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openTagEditor(selectedImage);
              }}
              className="absolute top-4 right-[8.5rem] z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
              title="Edit Tags"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
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
                {selectedImage.tags && selectedImage.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedImage.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-sage-500/40 text-white text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
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
