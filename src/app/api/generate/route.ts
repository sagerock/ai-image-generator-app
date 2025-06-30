import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const { prompt, model, idToken } = await request.json();

    // For now, we'll skip user verification and Firebase storage
    // and just generate the image with OpenAI
    
    console.log('API Request:', { prompt, model });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Image URL not found in OpenAI response');
    }

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
} 