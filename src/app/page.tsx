"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import Auth from '@/components/Auth';
import Link from 'next/link';
import Notification from '../components/Notification';

const getModelInfo = (modelId: string) => {
  const models: Record<string, { name: string; cost: number; credits: number; description: string; supportedRatios: string[] }> = {
    'flux-schnell': { name: 'FLUX Schnell', cost: 0.003, credits: 1, description: 'Fast generation, great for testing ideas', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'flux-dev': { name: 'FLUX Dev', cost: 0.025, credits: 1, description: 'High quality, excellent detail', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'ideogram-turbo': { name: 'Ideogram v2a Turbo', cost: 0.03, credits: 1, description: 'Fast & affordable, great text rendering + multiple styles', supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '16:10', '10:16', '3:1', '1:3'] },
    'playground-v25': { name: 'Playground v2.5', cost: 0.13, credits: 1, description: 'State-of-the-art aesthetic quality, beats DALL-E 3 & Midjourney', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'flux-pro': { name: 'FLUX 1.1 Pro', cost: 0.04, credits: 2, description: 'Faster and improved, excellent quality', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'seedream-3': { name: 'Seedream 3.0', cost: 0.03, credits: 2, description: 'Native 2K resolution, excellent text generation', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16', '3:2', '2:3'] },
    'ideogram-3': { name: 'Ideogram v3 Balanced', cost: 0.07, credits: 2, description: 'Balance speed, quality & cost, excellent text rendering', supportedRatios: ['1:3', '3:1', '1:2', '2:1', '9:16', '16:9', '10:16', '16:10', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '1:1'] },
    'imagen-4': { name: 'Imagen 4', cost: 0.05, credits: 3, description: 'Google flagship, superior detail & typography', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'dall-e-3': { name: 'DALL-E 3', cost: 0.08, credits: 3, description: 'Premium quality, best for complex prompts', supportedRatios: ['1:1', '16:9', '9:16'] }
  };
  return models[modelId] || models['flux-schnell'];
};

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux-schnell');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const availableRatios = ['1:1', '16:9', '4:3', '3:4', '9:16', '3:2', '2:3', '1:2', '2:1', '1:3', '3:1', '10:16', '16:10', '4:5', '5:4'];

  // Check admin status (simple email check)
  useEffect(() => {
    if (user?.email) {
      const adminEmails = ['admin@example.com', 'sage@sagerock.com']; // Add your admin emails here
      setIsAdmin(adminEmails.includes(user.email));
    }
  }, [user]);

  // Fetch user credits
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/user-info', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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

  useEffect(() => {
    // When the model changes, check if the current aspect ratio is supported.
    // If not, reset it to the first supported ratio of the new model.
    if (!getModelInfo(model).supportedRatios.includes(aspectRatio)) {
      setAspectRatio(getModelInfo(model).supportedRatios[0]);
    }
  }, [model, aspectRatio]);

  const handleGenerate = async () => {
    if (!user) {
      setNotification({ message: 'You must be logged in to generate images.', type: 'error' });
      setShowNotification(true);
      return;
    }

    const modelInfo = getModelInfo(model);
    if (credits !== null && credits < modelInfo.credits) {
      setNotification({ message: `You need ${modelInfo.credits} credits for this model. You have ${credits}.`, type: 'error' });
      setShowNotification(true);
      return;
    }

    setImageLoading(true);
    setImageUrl('');
    setNotification(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model, idToken, aspectRatio }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setNotification({ message: errorData.error || 'Failed to generate image', type: 'error' });
        setShowNotification(true);
        if (errorData.credits !== undefined) {
          setCredits(errorData.credits);
        }
        return;
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
      
      if (data.credits !== undefined) {
        setCredits(data.credits);
      }
      setNotification({ message: 'Image generated successfully!', type: 'success' });
      setShowNotification(true);

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setNotification({ message: `Failed to generate image: ${errorMessage}`, type: 'error' });
      setShowNotification(true);
    } finally {
      setImageLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your creative space...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          show={showNotification}
          onClose={() => setShowNotification(false)}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        {user ? (
          <div>
            <header className="flex flex-col sm:flex-row justify-between items-center mb-12 pb-6 border-b border-gray-700">
              <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Image Creator
                </h1>
                <p className="text-gray-400 mt-2">
                  Powered by DALL-E 3 & Replicate
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="px-4 py-2 bg-gray-800 rounded-xl border border-gray-700">
                  <span className="text-sm font-semibold text-green-400">
                    💳 {credits !== null ? `${credits} credits` : '...'}
                  </span>
                </div>

                <div className="flex space-x-3">
                  <Link href="/gallery" className="px-6 py-3 bg-gray-800 text-gray-200 font-semibold rounded-xl border border-gray-700 hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-lg">
                    Gallery
                  </Link>
                  
                  {isAdmin && (
                    <Link href="/admin" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-lg">
                      Admin
                    </Link>
                  )}
                  
                  <button onClick={() => auth.signOut()} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-lg">
                    Sign Out
                  </button>
                </div>
              </div>
            </header>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-700">
                <div className="space-y-8">
                  <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                      Your vision
                    </label>
                    <div className="relative w-full">
                      <textarea
                        id="prompt"
                        name="prompt"
                        rows={3}
                        className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none"
                        placeholder="A cinematic shot of a baby raccoon wearing a tiny top hat..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-8 w-full">
                    <div className="flex-grow">
                      <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
                        Select Model
                      </label>
                      <select
                        id="model"
                        name="model"
                        className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                      >
                        <optgroup label="💨 Fast & Affordable">
                          <option value="flux-schnell">FLUX Schnell - (1 credit)</option>
                          <option value="ideogram-turbo">Ideogram v2a Turbo - (1 credit)</option>
                        </optgroup>
                        <optgroup label="🎨 High Quality">
                          <option value="flux-dev">FLUX Dev - (1 credit)</option>
                          <option value="playground-v25">Playground v2.5 - (1 credit)</option>
                          <option value="flux-pro">FLUX 1.1 Pro - (2 credits)</option>
                        </optgroup>
                        <optgroup label="👑 Premium">
                          <option value="seedream-3">Seedream 3.0 - (2 credits)</option>
                          <option value="ideogram-3">Ideogram v3 Balanced - (2 credits)</option>
                          <option value="imagen-4">Imagen 4 - (3 credits)</option>
                          <option value="dall-e-3">DALL-E 3 - (3 credits)</option>
                        </optgroup>
                      </select>
                      <p className="text-sm text-gray-400 mt-1 pl-1">
                        {getModelInfo(model).description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                    <div className="flex flex-wrap gap-2">
                      {availableRatios.map((ratio) => {
                        const isSupported = getModelInfo(model).supportedRatios.includes(ratio);
                        return (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => isSupported && setAspectRatio(ratio)}
                            disabled={!isSupported}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              aspectRatio === ratio
                                ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            } ${
                              !isSupported
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                          >
                            {ratio}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={imageLoading || !prompt}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    {imageLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Generating...
                      </>
                    ) : (
                      'Generate Image'
                    )}
                  </button>
                </div>
              </div>

              {imageLoading && (
                <div className="text-center p-8">
                  <div className="animate-pulse">
                    <div className="w-full aspect-square bg-gray-700 rounded-2xl mx-auto flex items-center justify-center">
                      <p className="text-gray-400">Your vision is materializing...</p>
                    </div>
                  </div>
                </div>
              )}
              
              {imageUrl && (
                <div className="mt-8 bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-700">
                  <h2 className="text-2xl font-bold mb-4 text-center">Your Creation</h2>
                  <img src={imageUrl} alt="Generated" className="rounded-xl w-full mx-auto shadow-lg" />
                  <div className="text-center mt-4">
                    <a href={imageUrl} download="generated-image.webp" className="text-blue-400 hover:text-blue-300 transition-colors">
                      Download Image
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Auth />
        )}
      </div>
    </main>
  );
}
