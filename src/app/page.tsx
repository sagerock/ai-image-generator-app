"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Auth from '@/components/Auth';
import Notification from '../components/Notification';
import Header from '@/components/Header';
import { getModel, getActiveModels, getModelsByTier, getAllSupportedRatios } from '@/lib/models';
import type { ModelConfig, AspectRatio } from '@/lib/models/types';

const getModelInfo = (modelId: string): ModelConfig => {
  return getModel(modelId) || getModel('flux-schnell')!;
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

  const availableRatios = getAllSupportedRatios();

  useEffect(() => {
    if (user?.email) {
      const adminEmails = ['admin@example.com', 'sage@sagerock.com'];
      setIsAdmin(adminEmails.includes(user.email));
    }
  }, [user]);

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

  useEffect(() => {
    const modelInfo = getModelInfo(model);
    if (!modelInfo.supportedRatios.includes(aspectRatio as AspectRatio)) {
      setAspectRatio(modelInfo.supportedRatios[0]);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, idToken, aspectRatio }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setNotification({ message: errorData.error || 'Failed to generate image', type: 'error' });
        setShowNotification(true);
        if (errorData.credits !== undefined) setCredits(errorData.credits);
        return;
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
      if (data.credits !== undefined) setCredits(data.credits);
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
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-600 mx-auto mb-4"></div>
          <p className="text-stone-500 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

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

      {user ? (
        // LOGGED IN - Generator UI
        <div>
          <Header credits={credits} isAdmin={isAdmin} />

          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-stone-700 mb-2">
                    Describe your image
                  </label>
                  <textarea
                    id="prompt"
                    rows={3}
                    className="w-full border border-stone-300 rounded-lg p-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="A serene mountain landscape at sunset..."
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
                    className="w-full border border-stone-300 rounded-lg p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <optgroup label="Fast (1 credit)">
                      {getModelsByTier('fast').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.isNew && ' (New)'}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Standard (2 credits)">
                      {getModelsByTier('standard').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.isNew && ' (New)'}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Premium (3 credits)">
                      {getModelsByTier('premium').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.isNew && ' (New)'}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Ultra (4 credits)">
                      {getModelsByTier('ultra').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.isNew && ' (New)'}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-sm text-stone-500 mt-1">
                    {getModelInfo(model).description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Aspect Ratio</label>
                  <div className="flex flex-wrap gap-2">
                    {availableRatios.map((ratio) => {
                      const isSupported = getModelInfo(model).supportedRatios.includes(ratio as AspectRatio);
                      return (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => isSupported && setAspectRatio(ratio)}
                          disabled={!isSupported}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            aspectRatio === ratio
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          } ${!isSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {imageLoading ? 'Generating...' : 'Generate Image'}
                </button>
              </div>
            </div>

            {imageLoading && (
              <div className="bg-white rounded-xl border border-stone-200 p-8">
                <div className="animate-pulse">
                  <div className="w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center">
                    <p className="text-stone-400 text-sm">Generating your image...</p>
                  </div>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <img src={imageUrl} alt="Generated" className="rounded-lg w-full" />
                <div className="text-center mt-4">
                  <a
                    href={imageUrl}
                    download="generated-image.webp"
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Download Image
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // LANDING PAGE
        <div>
          <Header isLandingPage={true} />

          {/* Hero */}
          <section className="pt-24 pb-16 px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
                AI Image Generation
              </h1>
              <p className="text-lg text-stone-600 mb-8">
                Create stunning images with {getActiveModels().length} AI models. Fast, affordable, and easy to use.
              </p>
              <a
                href="#auth"
                className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                Get Started Free
              </a>
              <p className="text-sm text-stone-500 mt-3">
                50 free credits for new users
              </p>
            </div>
          </section>

          {/* Models */}
          <section id="models" className="py-16 bg-white">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-stone-900 mb-8 text-center">
                Available Models
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-stone-200 rounded-lg p-5">
                  <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Fast</div>
                  <div className="text-sm font-medium text-stone-900 mb-1">1 credit</div>
                  <div className="space-y-1 text-sm text-stone-600">
                    {getModelsByTier('fast').map(m => (
                      <div key={m.id}>{m.name}</div>
                    ))}
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg p-5">
                  <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Standard</div>
                  <div className="text-sm font-medium text-stone-900 mb-1">2 credits</div>
                  <div className="space-y-1 text-sm text-stone-600">
                    {getModelsByTier('standard').map(m => (
                      <div key={m.id}>{m.name}</div>
                    ))}
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg p-5">
                  <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Premium</div>
                  <div className="text-sm font-medium text-stone-900 mb-1">3 credits</div>
                  <div className="space-y-1 text-sm text-stone-600">
                    {getModelsByTier('premium').map(m => (
                      <div key={m.id}>{m.name}</div>
                    ))}
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg p-5">
                  <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Ultra</div>
                  <div className="text-sm font-medium text-stone-900 mb-1">4 credits</div>
                  <div className="space-y-1 text-sm text-stone-600">
                    {getModelsByTier('ultra').map(m => (
                      <div key={m.id}>{m.name}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="py-16">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-stone-900 mb-8 text-center">
                Why Optic Engine
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="font-semibold text-stone-900 mb-2">Fast Generation</h3>
                  <p className="text-sm text-stone-600">Create images in seconds with our optimized models.</p>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-stone-900 mb-2">Affordable</h3>
                  <p className="text-sm text-stone-600">Starting at just a few cents per image.</p>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-stone-900 mb-2">Multiple Styles</h3>
                  <p className="text-sm text-stone-600">Photorealistic, artistic, logos, and more.</p>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-stone-900 mb-2">Flexible Sizes</h3>
                  <p className="text-sm text-stone-600">Support for 15+ aspect ratios.</p>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-stone-900 mb-2">Easy to Use</h3>
                  <p className="text-sm text-stone-600">Simple interface, powerful results.</p>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-stone-900 mb-2">Personal Gallery</h3>
                  <p className="text-sm text-stone-600">All your creations saved and organized.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 bg-white">
            <div className="max-w-xl mx-auto px-4 text-center">
              <h2 className="text-2xl font-bold text-stone-900 mb-2">
                Start Creating
              </h2>
              <p className="text-stone-600 mb-6">
                Sign up and get 50 free credits to try all our models.
              </p>

              <div id="auth" className="mb-8">
                <Auth />
              </div>

              <div className="flex justify-center gap-8 text-sm">
                <div>
                  <div className="font-semibold text-stone-900">50</div>
                  <div className="text-stone-500">Free Credits</div>
                </div>
                <div>
                  <div className="font-semibold text-stone-900">{getActiveModels().length}</div>
                  <div className="text-stone-500">AI Models</div>
                </div>
                <div>
                  <div className="font-semibold text-stone-900">15+</div>
                  <div className="text-stone-500">Aspect Ratios</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
