"use client";

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import Auth from '@/components/Auth';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('dall-e-3');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleGenerate = async () => {
    setImageLoading(true);
    setImageUrl('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);

    } catch (error) {
      console.error(error);
      // You might want to show an error message to the user here
    } finally {
      setImageLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto p-4">

        {user ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">AI Image Creator</h1>
              <button
                onClick={() => auth.signOut()}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
            
            <div className="max-w-xl mx-auto">
              <div className="space-y-4">
                <textarea
                  className="w-full p-2 border rounded-md bg-gray-200 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your image prompt..."
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                
                <div className="flex items-center justify-between">
                  <select 
                    className="p-2 border rounded-md bg-gray-200 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <option value="dall-e-3">DALL-E 3</option>
                    <option value="stable-diffusion">Stable Diffusion</option>
                    <option value="leonardo">Leonardo</option>
                  </select>
                  
                  <button 
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
                    onClick={handleGenerate}
                    disabled={imageLoading || !prompt}
                  >
                    {imageLoading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              <div className="mt-8 p-4 border rounded-md h-96 flex items-center justify-center bg-gray-200 dark:bg-gray-800 overflow-hidden">
                {imageLoading ? (
                  <div className="animate-pulse">
                    <p className="text-gray-500">Generating your masterpiece...</p>
                  </div>
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Generated image" className="max-w-full max-h-full object-contain" />
                ) : (
                  <p className="text-gray-500">Your generated image will appear here</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Auth />
        )}

      </div>
    </main>
  );
}
