"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Notification from '@/components/Notification';
import Header from '@/components/Header';
import Link from 'next/link';
import { getEditingModels } from '@/lib/models';
import type { AspectRatio } from '@/lib/models/types';

interface GalleryImage {
  id: string;
  prompt: string;
  model: string;
  imageUrl: string;
  createdAt: string;
  aspectRatio?: string;
}

// Supported aspect ratios and their decimal values
const ASPECT_RATIOS: { ratio: AspectRatio; value: number }[] = [
  { ratio: '1:1', value: 1 },
  { ratio: '16:9', value: 16/9 },
  { ratio: '9:16', value: 9/16 },
  { ratio: '4:3', value: 4/3 },
  { ratio: '3:4', value: 3/4 },
  { ratio: '3:2', value: 3/2 },
  { ratio: '2:3', value: 2/3 },
  { ratio: '21:9', value: 21/9 },
  { ratio: '4:5', value: 4/5 },
  { ratio: '5:4', value: 5/4 },
];

// Find the closest matching aspect ratio
function detectAspectRatio(width: number, height: number): AspectRatio {
  const imageRatio = width / height;
  let closest = ASPECT_RATIOS[0];
  let smallestDiff = Math.abs(imageRatio - closest.value);

  for (const ar of ASPECT_RATIOS) {
    const diff = Math.abs(imageRatio - ar.value);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = ar;
    }
  }

  return closest.ratio;
}

export default function EditPage() {
  const { user, loading: authLoading } = useAuth();
  const [sourceTab, setSourceTab] = useState<'upload' | 'gallery'>('upload');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux-kontext-edit');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [strength, setStrength] = useState(0.8);
  const [imageLoading, setImageLoading] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryImage | null>(null);

  const editingModels = getEditingModels();

  // Fetch user credits
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/user-info', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCredits(data.credits);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    fetchUserInfo();
  }, [user]);

  // Fetch gallery images when tab switches
  useEffect(() => {
    const fetchGallery = async () => {
      if (!user || sourceTab !== 'gallery') return;
      setGalleryLoading(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/gallery', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setGalleryImages(data.images || []);
        }
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
      } finally {
        setGalleryLoading(false);
      }
    };
    fetchGallery();
  }, [user, sourceTab]);

  // Handle file upload
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setNotification({ message: 'Please select an image file', type: 'error' });
      setShowNotification(true);
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadPreview(dataUrl);

      // Detect aspect ratio from the uploaded image
      const img = new Image();
      img.onload = () => {
        const detected = detectAspectRatio(img.naturalWidth, img.naturalHeight);
        setAspectRatio(detected);
        console.log(`Detected aspect ratio: ${detected} (${img.naturalWidth}x${img.naturalHeight})`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    setSelectedGalleryImage(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Get the current source image URL
  const getSourceImageUrl = (): string | null => {
    if (sourceTab === 'upload' && uploadPreview) {
      return uploadPreview;
    }
    if (sourceTab === 'gallery' && selectedGalleryImage) {
      return selectedGalleryImage.imageUrl;
    }
    return null;
  };

  const handleEdit = async () => {
    if (!user) {
      setNotification({ message: 'You must be logged in to edit images.', type: 'error' });
      setShowNotification(true);
      return;
    }

    const sourceImageUrl = getSourceImageUrl();
    if (!sourceImageUrl) {
      setNotification({ message: 'Please select or upload an image first.', type: 'error' });
      setShowNotification(true);
      return;
    }

    if (!prompt.trim()) {
      setNotification({ message: 'Please describe how you want to edit the image.', type: 'error' });
      setShowNotification(true);
      return;
    }

    const modelInfo = editingModels.find(m => m.id === model);
    if (credits !== null && modelInfo && credits < modelInfo.credits) {
      setNotification({ message: `You need ${modelInfo.credits} credits for this model. You have ${credits}.`, type: 'error' });
      setShowNotification(true);
      return;
    }

    setImageLoading(true);
    setResultImageUrl('');
    setNotification(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          idToken,
          aspectRatio,
          imageUrl: sourceImageUrl,
          strength,
          sourceImageId: selectedGalleryImage?.id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setNotification({ message: errorData.error || 'Failed to edit image', type: 'error' });
        setShowNotification(true);
        if (errorData.credits !== undefined) setCredits(errorData.credits);
        return;
      }

      const data = await response.json();
      setResultImageUrl(data.imageUrl);
      if (data.credits !== undefined) setCredits(data.credits);
      setNotification({ message: 'Image edited successfully!', type: 'success' });
      setShowNotification(true);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setNotification({ message: `Failed to edit image: ${errorMessage}`, type: 'error' });
      setShowNotification(true);
    } finally {
      setImageLoading(false);
    }
  };

  if (authLoading) {
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
          <p className="text-stone-600 mb-6">You need to be signed in to edit images.</p>
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

  const sourceImageUrl = getSourceImageUrl();

  return (
    <main className="min-h-screen bg-stone-50">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          show={showNotification}
          onClose={() => setShowNotification(false)}
        />
      )}

      <Header credits={credits} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Edit Image</h1>
          <p className="text-stone-600">Upload an image or select from your gallery, then describe what changes you want.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left column - Source Image */}
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Source Image</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSourceTab('upload')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sourceTab === 'upload'
                    ? 'bg-sage-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setSourceTab('gallery')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sourceTab === 'gallery'
                    ? 'bg-sage-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                From Gallery
              </button>
            </div>

            {/* Upload Tab */}
            {sourceTab === 'upload' && (
              <div>
                {uploadPreview ? (
                  <div className="relative">
                    <img
                      src={uploadPreview}
                      alt="Upload preview"
                      className="w-full rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadPreview('');
                      }}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-sage-500 bg-sage-50'
                        : 'border-stone-300 hover:border-stone-400'
                    }`}
                  >
                    <svg className="w-12 h-12 mx-auto text-stone-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-stone-600 mb-1">Drop an image here or click to upload</p>
                    <p className="text-sm text-stone-400">PNG, JPG, WebP up to 10MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Gallery Tab */}
            {sourceTab === 'gallery' && (
              <div>
                {galleryLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-300 border-t-stone-600 mx-auto mb-2"></div>
                    <p className="text-sm text-stone-500">Loading gallery...</p>
                  </div>
                ) : galleryImages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-stone-500 mb-4">No images in your gallery yet.</p>
                    <Link href="/" className="text-sage-500 hover:text-sage-600 text-sm font-medium">
                      Generate your first image
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {galleryImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => {
                          setSelectedGalleryImage(img);
                          setUploadedFile(null);
                          setUploadPreview('');
                          // Use stored aspect ratio if available, otherwise detect it
                          if (img.aspectRatio) {
                            setAspectRatio(img.aspectRatio as AspectRatio);
                          } else {
                            // Detect from image
                            const detectImg = new Image();
                            detectImg.onload = () => {
                              const detected = detectAspectRatio(detectImg.naturalWidth, detectImg.naturalHeight);
                              setAspectRatio(detected);
                            };
                            detectImg.src = img.imageUrl;
                          }
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedGalleryImage?.id === img.id
                            ? 'border-sage-500'
                            : 'border-transparent hover:border-stone-300'
                        }`}
                      >
                        <img
                          src={img.imageUrl}
                          alt={img.prompt}
                          className="w-full h-full object-cover"
                        />
                        {selectedGalleryImage?.id === img.id && (
                          <div className="absolute inset-0 bg-sage-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-sage-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column - Edit Options */}
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Edit Options</h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-stone-700 mb-2">
                  Describe the changes
                </label>
                <textarea
                  id="prompt"
                  rows={3}
                  className="w-full border border-stone-300 rounded-lg p-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 resize-none"
                  placeholder="Make the sky more dramatic, add sunset colors..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-stone-700 mb-2">
                  Model
                </label>
                <select
                  id="model"
                  className="w-full border border-stone-300 rounded-lg p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {editingModels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.credits} credits) — {m.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Aspect Ratio
                </label>
                <p className="text-sm text-stone-600 bg-stone-50 rounded-lg px-3 py-2">
                  {aspectRatio} <span className="text-stone-400">(auto-detected from source image)</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Edit Strength: {Math.round(strength * 100)}%
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.1"
                  value={strength}
                  onChange={(e) => setStrength(parseFloat(e.target.value))}
                  className="w-full accent-sage-500"
                />
                <div className="flex justify-between text-xs text-stone-400 mt-1">
                  <span>Subtle</span>
                  <span>Major changes</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEdit}
                disabled={imageLoading || !prompt || !sourceImageUrl}
                className="w-full bg-sage-500 hover:bg-sage-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {imageLoading ? 'Editing...' : 'Edit Image'}
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        {imageLoading && (
          <div className="mt-6 bg-white rounded-xl border border-stone-200 p-8">
            <div className="animate-pulse">
              <div className="w-full aspect-square max-w-md mx-auto bg-stone-100 rounded-lg flex items-center justify-center">
                <p className="text-stone-400 text-sm">Editing your image...</p>
              </div>
            </div>
          </div>
        )}

        {resultImageUrl && (
          <div className="mt-6 bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Result</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {sourceImageUrl && (
                <div>
                  <p className="text-sm text-stone-500 mb-2">Original</p>
                  <img src={sourceImageUrl} alt="Original" className="rounded-lg w-full" />
                </div>
              )}
              <div>
                <p className="text-sm text-stone-500 mb-2">Edited</p>
                <img src={resultImageUrl} alt="Edited" className="rounded-lg w-full" />
                <div className="text-center mt-3">
                  <a
                    href={resultImageUrl}
                    download="edited-image.webp"
                    className="text-sm text-sage-500 hover:text-sage-600 font-medium"
                  >
                    Download Edited Image
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
