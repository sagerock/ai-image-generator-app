"use client";

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import Auth from '@/components/Auth';
import Link from 'next/link';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('dall-e-3');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleGenerate = async () => {
    if (!user) {
      alert("You must be logged in to generate images.");
      return;
    }

    setImageLoading(true);
    setImageUrl('');

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model, idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);

    } catch (error) {
      console.error(error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {user ? (
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
              <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Image Creator
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Transform your ideas into stunning visuals
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/gallery"
                  className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  📸 Gallery
                </Link>
                <button
                  onClick={() => auth.signOut()}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Sign Out
                </button>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                <div className="space-y-6">
                  {/* Prompt Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                      Describe your image
                    </label>
                    <textarea
                      className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="A majestic sunset over snow-capped mountains with a crystal clear lake in the foreground..."
                      rows={4}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>
                  
                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div className="w-full sm:w-auto">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        AI Model
                      </label>
                      <select 
                        className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[200px]"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                      >
                        <option value="dall-e-3">DALL-E 3 (Premium)</option>
                        <option value="stable-diffusion">Stable Diffusion</option>
                        <option value="leonardo">Leonardo AI</option>
                      </select>
                    </div>
                    
                    <button 
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 active:scale-95"
                      onClick={handleGenerate}
                      disabled={imageLoading || !prompt.trim()}
                    >
                      {imageLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Creating Magic...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>✨ Generate Image</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Display */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Generated Image
                  </h3>
                </div>
                <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 min-h-[400px]">
                  {imageLoading ? (
                    <div className="text-center">
                      <div className="animate-pulse mb-4">
                        <div className="w-24 h-24 bg-blue-200 dark:bg-blue-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <div className="text-2xl">🎨</div>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">
                        Creating your masterpiece...
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        This may take up to 30 seconds
                      </p>
                    </div>
                  ) : imageUrl ? (
                    <div className="w-full h-full p-6">
                      <img 
                        src={imageUrl} 
                        alt="Generated image" 
                        className="w-full h-full object-contain rounded-xl shadow-lg" 
                      />
                    </div>
                  ) : (
                    <div className="text-center p-12">
                      <div className="text-6xl mb-4">🖼️</div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                        Your generated image will appear here
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        Enter a prompt above and click generate to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  AI Image Creator
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Sign in to start creating amazing images with AI
                </p>
              </div>
              <Auth />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
