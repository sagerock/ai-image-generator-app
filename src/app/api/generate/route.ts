import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
// The OPENAI_API_KEY environment variable is automatically used
const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const { prompt, model } = await request.json();

    console.log('API Request:', { prompt, model });

    // We'll use dall-e-3 for now, but we can make this dynamic later
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('Image URL not found in response');
    }

    return NextResponse.json({ imageUrl });
    
  } catch (error) {
    console.error('API Error:', error);
    // It's good practice to check if the error is an APIError from OpenAI
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
} 