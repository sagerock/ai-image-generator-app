"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import Auth from '@/components/Auth';
import Link from 'next/link';

const getModelInfo = (modelId: string) => {
  const models: Record<string, { name: string; cost: number; credits: number; description: string }> = {
    'flux-schnell': { name: 'FLUX Schnell', cost: 0.003, credits: 1, description: 'Fast generation, great for testing ideas' },
    'stable-diffusion': { name: 'Stable Diffusion', cost: 0.002, credits: 1, description: 'Classic model, reliable results' },
    'flux-dev': { name: 'FLUX Dev', cost: 0.025, credits: 1, description: 'High quality, excellent detail' },
    'flux-pro': { name: 'FLUX Pro', cost: 0.04, credits: 2, description: 'Top quality, best prompt following' },
    'dall-e-3': { name: 'DALL-E 3', cost: 0.08, credits: 3, description: 'Premium OpenAI model' }
  };
  return models[modelId] || models['flux-schnell'];
};

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux-schnell');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const handleGenerate = async () => {
    if (!user) {
      alert("You must be logged in to generate images.");
      return;
    }

    const modelInfo = getModelInfo(model);
    if (credits !== null && credits < modelInfo.credits) {
      alert(`You need ${modelInfo.credits} credits to generate an image with ${modelInfo.name}. You currently have ${credits} credits.`);
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
        if (response.status === 402) {
          alert(errorData.message || 'Insufficient credits');
          setCredits(errorData.credits || 0);
          return;
        }
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
      
      // Update credits after successful generation
      if (data.credits !== undefined) {
        setCredits(data.credits);
      }

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
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                {/* Credits Display */}
                <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-xl border border-green-200 dark:border-green-700">
                  <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                    💳 {credits !== null ? `${credits} credits` : 'Loading...'}
                  </span>
                </div>

                <div className="flex space-x-3">
                  <Link
                    href="/gallery"
                    className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    📸 Gallery
                  </Link>
                  
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      🛠️ Admin
                    </Link>
                  )}
                  
                  <button
                    onClick={() => auth.signOut()}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Sign Out
                  </button>
                </div>
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
                        className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[280px]"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                      >
                        <optgroup label="💨 Fast & Affordable">
                          <option value="flux-schnell">FLUX Schnell - $0.003 💨</option>
                          <option value="stable-diffusion">Stable Diffusion - $0.002 ⚡</option>
                        </optgroup>
                        <optgroup label="🎨 High Quality">
                          <option value="flux-dev">FLUX Dev - $0.025 🎨</option>
                          <option value="flux-pro">FLUX Pro - $0.04 ✨</option>
                        </optgroup>
                        <optgroup label="🚀 Premium">
                          <option value="dall-e-3">DALL-E 3 - $0.08 🚀</option>
                        </optgroup>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getModelInfo(model).description}
                      </p>
                    </div>
                    
                    <button 
                      className={`w-full sm:w-auto px-8 py-3 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                        credits !== null && credits < getModelInfo(model).credits
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      }`}
                      onClick={handleGenerate}
                      disabled={imageLoading || !prompt.trim() || (credits !== null && credits < getModelInfo(model).credits)}
                    >
                      {imageLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Creating Magic...</span>
                        </div>
                      ) : credits !== null && credits < getModelInfo(model).credits ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span>💳 Need {getModelInfo(model).credits} Credits</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>✨ Generate Image ({getModelInfo(model).credits} credit{getModelInfo(model).credits > 1 ? 's' : ''})</span>
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
