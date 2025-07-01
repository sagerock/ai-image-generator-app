"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import Auth from '@/components/Auth';
import Link from 'next/link';
import Notification from '../components/Notification';
import Header from '@/components/Header';
import SubscriptionManager from '@/components/SubscriptionManager';

const getModelInfo = (modelId: string) => {
  const models: Record<string, { name: string; cost: number; credits: number; description: string; supportedRatios: string[] }> = {
    'lcm': { name: 'LCM (Latent Consistency)', cost: 0.0014, credits: 1, description: 'Ultra-fast 0.6s generation, 40 runs per $1, lightning speed', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'realistic-vision': { name: 'Realistic Vision v5.1', cost: 0.0014, credits: 1, description: 'Photorealistic specialist, 2s generation, 40 runs per $1', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'flux-schnell': { name: 'FLUX Schnell', cost: 0.003, credits: 1, description: 'Fast generation, great for testing ideas', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'proteus-v03': { name: 'Proteus v0.3', cost: 0.018, credits: 2, description: 'Anime specialist, ultra-affordable, enhanced lighting & aesthetics', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'flux-dev': { name: 'FLUX Dev', cost: 0.025, credits: 2, description: 'High quality, excellent detail', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'ideogram-turbo': { name: 'Ideogram v2a Turbo', cost: 0.03, credits: 2, description: 'Fast & affordable, great text rendering + multiple styles', supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '16:10', '10:16', '3:1', '1:3'] },
    'playground-v25': { name: 'Playground v2.5', cost: 0.13, credits: 5, description: 'State-of-the-art aesthetic quality, beats DALL-E 3 & Midjourney', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'flux-pro': { name: 'FLUX 1.1 Pro', cost: 0.04, credits: 3, description: 'Faster and improved, excellent quality', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'] },
    'seedream-3': { name: 'Seedream 3.0', cost: 0.03, credits: 2, description: 'Native 2K resolution, excellent text generation', supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16', '3:2', '2:3'] },
    'ideogram-3': { name: 'Ideogram v3 Balanced', cost: 0.07, credits: 3, description: 'Balance speed, quality & cost, excellent text rendering', supportedRatios: ['1:3', '3:1', '1:2', '2:1', '9:16', '16:9', '10:16', '16:10', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '1:1'] },
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
    <main className="min-h-screen bg-white text-gray-900">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          show={showNotification}
          onClose={() => setShowNotification(false)}
        />
      )}
      <div className="container mx-auto px-4 pt-8 pb-8">
        {user ? (
          <div>
            <Header credits={credits} isAdmin={isAdmin} />
            
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
                        <optgroup label="⚡ Lightning Fast & Ultra-Cheap">
                          <option value="lcm">LCM (Latent Consistency) - (1 credit)</option>
                          <option value="realistic-vision">Realistic Vision v5.1 - (1 credit)</option>
                          <option value="flux-schnell">FLUX Schnell - (1 credit)</option>
                        </optgroup>
                        <optgroup label="💨 Fast & Affordable">
                          <option value="proteus-v03">Proteus v0.3 - (2 credits)</option>
                          <option value="flux-dev">FLUX Dev - (2 credits)</option>
                          <option value="ideogram-turbo">Ideogram v2a Turbo - (2 credits)</option>
                          <option value="seedream-3">Seedream 3.0 - (2 credits)</option>
                        </optgroup>
                        <optgroup label="🎨 Premium Quality">
                          <option value="flux-pro">FLUX 1.1 Pro - (3 credits)</option>
                          <option value="ideogram-3">Ideogram v3 Balanced - (3 credits)</option>
                          <option value="imagen-4">Imagen 4 - (3 credits)</option>
                          <option value="dall-e-3">DALL-E 3 - (3 credits)</option>
                        </optgroup>
                        <optgroup label="👑 Ultra Premium">
                          <option value="playground-v25">Playground v2.5 - (5 credits)</option>
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
              
              {/* Subscription Management */}
              <div className="mt-8">
                <SubscriptionManager />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Header isLandingPage={true} />
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-amber-50"></div>
              
              <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent mb-6">
                    Optic Engine
                  </h1>
                  <p className="text-xl sm:text-2xl text-stone-600 mb-4 max-w-3xl mx-auto">
                    The world&apos;s most comprehensive AI image creation platform
                  </p>
                  <p className="text-lg text-stone-500 mb-8 max-w-4xl mx-auto">
                    Create stunning images in seconds with 12 cutting-edge AI models. From ultra-fast 0.6s creation 
                    to premium photorealistic quality - all at unbeatable prices starting at just 2.5¢ per image.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <div className="bg-emerald-50 backdrop-blur-sm border border-emerald-200 rounded-xl px-6 py-3">
                      <span className="text-emerald-700 font-semibold">⚡ 0.6s creation</span>
                    </div>
                    <div className="bg-amber-50 backdrop-blur-sm border border-amber-200 rounded-xl px-6 py-3">
                      <span className="text-amber-700 font-semibold">💰 40 runs per $1</span>
                    </div>
                    <div className="bg-rose-50 backdrop-blur-sm border border-rose-200 rounded-xl px-6 py-3">
                      <span className="text-rose-700 font-semibold">🎨 12 AI models</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Model Showcase */}
            <section id="models" className="py-16 bg-stone-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                    12 Cutting-Edge AI Models
                  </h2>
                  <p className="text-lg text-stone-600 max-w-3xl mx-auto">
                    From lightning-fast creation to premium quality, we've got the perfect model for every need and budget.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Ultra-Fast & Cheap - 1 Credit */}
                  <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-xl p-6 border border-yellow-500/20">
                    <div className="text-yellow-400 text-2xl mb-3">⚡</div>
                    <h3 className="text-xl font-bold text-white mb-2">Ultra-Fast Tier</h3>
                    <p className="text-gray-300 mb-4">1 credit • Lightning speed & value</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">LCM</span>
                        <span className="text-sm text-yellow-400">0.6s • 40/$1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Realistic Vision</span>
                        <span className="text-sm text-yellow-400">2s • 40/$1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">FLUX Schnell</span>
                        <span className="text-sm text-yellow-400">Fast • 333/$1</span>
                      </div>
                    </div>
                  </div>

                  {/* Standard - 2 Credits */}
                  <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/20">
                    <div className="text-green-400 text-2xl mb-3">💨</div>
                    <h3 className="text-xl font-bold text-white mb-2">Standard Tier</h3>
                    <p className="text-gray-300 mb-4">2 credits • Quality & affordability</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Proteus v0.3</span>
                        <span className="text-sm text-green-400">Anime • 55/$1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">FLUX Dev</span>
                        <span className="text-sm text-green-400">Quality • 40/$1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Ideogram Turbo</span>
                        <span className="text-sm text-green-400">Text • 33/$1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Seedream 3.0</span>
                        <span className="text-sm text-green-400">2K • 33/$1</span>
                      </div>
                    </div>
                  </div>

                  {/* Premium - 3 Credits */}
                  <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-500/20">
                    <div className="text-blue-400 text-2xl mb-3">🎨</div>
                    <h3 className="text-xl font-bold text-white mb-2">Premium Tier</h3>
                    <p className="text-gray-300 mb-4">3 credits • Professional quality</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">FLUX 1.1 Pro</span>
                        <span className="text-sm text-blue-400">Enhanced • 25/$1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Ideogram v3</span>
                        <span className="text-sm text-blue-400">Text Master • 14/$1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Imagen 4</span>
                        <span className="text-sm text-blue-400">Google • 20/$1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">DALL-E 3</span>
                        <span className="text-sm text-blue-400">OpenAI • 12/$1</span>
                      </div>
                    </div>
                  </div>

                  {/* Ultra Premium - 5 Credits */}
                  <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/20 md:col-span-2 lg:col-span-3">
                    <div className="text-center mb-6">
                      <div className="text-purple-400 text-2xl mb-3">👑</div>
                      <h3 className="text-xl font-bold text-white mb-2">Ultra Premium Tier</h3>
                      <p className="text-gray-300">5 credits • State-of-the-art aesthetic quality</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg text-gray-300">Playground v2.5</div>
                      <div className="text-sm text-purple-400">Beats DALL-E 3 & Midjourney in user studies • 7 images per $1</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-stone-900 mb-4">Simple, Transparent Pricing</h2>
                  <p className="text-xl text-stone-600 mb-8">Choose the plan that works best for you</p>
                  
                  {/* Free Credits Banner */}
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl p-6 mb-8 max-w-2xl mx-auto shadow-lg">
                    <div className="flex items-center justify-center">
                      <span className="text-3xl mr-3">🚀</span>
                      <div>
                        <div className="font-bold text-xl">All New Users Get 50 Free Credits!</div>
                        <div className="text-emerald-100 text-sm mt-1">No credit card required • Start creating right away • Worth up to $12.50</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* Monthly Subscription */}
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 bg-emerald-600 text-white text-center py-2 text-sm font-semibold">
                      ⭐ Most Popular
                    </div>
                    <div className="p-8 pt-16">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-stone-900 mb-2">Monthly Plan</h3>
                        <div className="text-4xl font-bold text-emerald-600 mb-2">$10<span className="text-lg text-stone-600">/month</span></div>
                        <p className="text-stone-600">400 credits per month</p>
                      </div>
                      
                      <div className="space-y-4 mb-8">
                        <div className="flex items-center">
                          <div className="text-emerald-600 mr-3">✅</div>
                          <span className="text-stone-700">400 credits every month</span>
                        </div>
                        <div className="flex items-center">
                          <div className="text-emerald-600 mr-3">✅</div>
                          <span className="text-stone-700">Unused credits roll over</span>
                        </div>
                        <div className="flex items-center">
                          <div className="text-emerald-600 mr-3">✅</div>
                          <span className="text-stone-700">Access to all 12 AI models</span>
                        </div>
                        <div className="flex items-center">
                          <div className="text-emerald-600 mr-3">✅</div>
                          <span className="text-stone-700">Cancel anytime</span>
                        </div>
                        <div className="flex items-center">
                          <div className="text-emerald-600 mr-3">✅</div>
                          <span className="text-stone-700">Priority support</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-stone-500 mb-4">Best value for regular users</div>
                      </div>
                    </div>
                  </div>

                  {/* Credit Packages */}
                  <div className="bg-white rounded-2xl shadow-lg border border-stone-200">
                    <div className="p-8">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-stone-900 mb-2">Pay As You Go</h3>
                        <p className="text-stone-600">Buy credits when you need them</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-stone-50 rounded-lg">
                          <div>
                            <div className="font-semibold text-stone-900">100 Credits</div>
                            <div className="text-sm text-stone-600">Perfect for casual use</div>
                          </div>
                          <div className="text-xl font-bold text-stone-900">$10</div>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div>
                            <div className="font-semibold text-stone-900">250 Credits</div>
                            <div className="text-sm text-emerald-600">20% savings</div>
                          </div>
                          <div className="text-xl font-bold text-emerald-600">$20</div>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div>
                            <div className="font-semibold text-stone-900">500 Credits</div>
                            <div className="text-sm text-emerald-600">30% savings</div>
                          </div>
                          <div className="text-xl font-bold text-emerald-600">$35</div>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <div className="text-sm text-stone-500">No expiration • Use anytime</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-12">
                  <p className="text-stone-600 mb-4">All plans include access to our complete suite of AI models</p>
                  <p className="text-sm text-stone-500">💳 Secure payments powered by Stripe • Cancel anytime</p>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Why Choose Optic Engine?
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="bg-blue-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Blazing Fast</h3>
                    <p className="text-gray-400">Create images in as little as 0.6 seconds with our Latent Consistency Model.</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-green-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💰</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Unbeatable Prices</h3>
                    <p className="text-gray-400">Starting at just 2.5¢ per image - get 40 images for $1 with our ultra-fast models.</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-purple-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🎨</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Every Style</h3>
                    <p className="text-gray-400">Anime, photorealistic, artistic, text rendering - we have specialized models for every style.</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-orange-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📐</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Flexible Ratios</h3>
                    <p className="text-gray-400">Support for 15+ aspect ratios from square to ultra-wide, perfect for any project.</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-red-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔧</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Easy to Use</h3>
                    <p className="text-gray-400">Simple interface with powerful features. Just type your prompt and choose your model.</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-cyan-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🚀</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Latest Tech</h3>
                    <p className="text-gray-400">Access to the newest AI models from FLUX, Ideogram, Google, OpenAI, and more.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Use Cases */}
            <section className="py-16 bg-gray-800/30">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Perfect For Every Need
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <div className="text-2xl mb-3">🎨</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Artists & Designers</h3>
                    <p className="text-gray-400 text-sm">Concept art, illustrations, mood boards, and creative exploration.</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <div className="text-2xl mb-3">📱</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Content Creators</h3>
                    <p className="text-gray-400 text-sm">Social media posts, thumbnails, marketing materials, and brand assets.</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <div className="text-2xl mb-3">🏢</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Businesses</h3>
                    <p className="text-gray-400 text-sm">Product mockups, presentations, advertising, and professional imagery.</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <div className="text-2xl mb-3">🎓</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Students & Educators</h3>
                    <p className="text-gray-400 text-sm">Educational materials, research visuals, and learning projects.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-16">
              <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                  Ready to Create?
                </h2>
                <p className="text-lg text-stone-600 mb-4">
                  Join thousands of creators already using Optic Engine to bring their visions to life.
                </p>
                
                {/* Free Credits Highlight */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-2xl mr-2">🎁</span>
                    <h3 className="text-xl font-bold text-emerald-800">New Users Get 50 Free Credits!</h3>
                  </div>
                  <p className="text-emerald-700 font-medium">
                    No credit card required • Start creating immediately • Worth $5-12.50 value
                  </p>
                </div>
                
                <div id="auth" className="mb-8">
                  <Auth />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">0.6s</div>
                    <div className="text-sm text-stone-500">Fastest Creation</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">40/$1</div>
                    <div className="text-sm text-stone-500">Best Value</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-rose-600">12</div>
                    <div className="text-sm text-stone-500">AI Models</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
