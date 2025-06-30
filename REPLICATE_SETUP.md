# 🔗 Replicate API Setup Guide

This guide will help you set up Replicate API access to unlock multiple AI image generation models in your app.

## 🎯 What You Get with Replicate

With Replicate integration, you get access to multiple state-of-the-art AI models:

- **💨 FLUX Schnell** - Ultra-fast generation (4 steps) - $0.003/image, 1 credit
- **⚡ Stable Diffusion** - Classic reliable model - $0.0024/image, 1 credit  
- **🎨 FLUX Dev** - High quality with excellent detail - $0.025/image, 1 credit
- **✨ FLUX 1.1 Pro** - Top quality with best prompt following - $0.04/image, 2 credits

## 📝 Setup Steps

### 1. Create Replicate Account

1. Go to [Replicate.com](https://replicate.com/)
2. Sign up for a free account
3. Replicate offers pay-per-use pricing with no monthly fees

### 2. Get Your API Token

1. Navigate to [API Tokens](https://replicate.com/account/api-tokens)
2. Click **"Create token"**
3. Give it a name like "AI Image Creator App"
4. Copy the token (starts with `r8_`)

### 3. Add to Environment Variables

Add your Replicate API token to your `.env.local` file:

```env
# Replicate Configuration
REPLICATE_API_TOKEN="r8_your-actual-token-here"
```

### 4. Test the Integration

1. Restart your development server: `npm run dev`
2. Sign in to your app
3. Try generating an image with FLUX Schnell (fastest/cheapest option)
4. Check the console for successful API calls

## 💰 Pricing Comparison

### Available Models & Pricing

| Model | Provider | Cost (per image) | Credits | Best For |
|-------|----------|------------|---------|----------|
| FLUX Schnell | Replicate | $0.003 | 1 | Testing, quick iterations |
| Stable Diffusion 2.1 | Replicate | $0.0024 | 1 | Classic reliable model, proven results |
| FLUX Dev | Replicate | $0.025 | 1 | High quality, detailed images |
| FLUX 1.1 Pro | Replicate | $0.04 | 2 | Professional quality, best prompts |
| DALL-E 3 | OpenAI | $0.08 | 3 | Highest quality, best for complex prompts |

### Model Recommendations

- For **speed and affordability**, use **FLUX Schnell** or **Stable Diffusion 2.1**.
- For **high-quality** images, **FLUX Dev** and **FLUX 1.1 Pro** are excellent choices.
- For the **absolute best quality** and prompt adherence, use **DALL-E 3**.

## 🔧 Model Capabilities

### FLUX Schnell
- **Speed**: Ultra-fast (4 inference steps)
- **Quality**: Good for quick iterations
- **Best for**: Testing prompts, rapid prototyping

### Stable Diffusion  
- **Speed**: Fast (50 inference steps)
- **Quality**: Reliable, well-tested
- **Best for**: General image generation, familiar results

### FLUX Dev
- **Speed**: Moderate
- **Quality**: High detail, excellent composition
- **Best for**: Professional work, detailed images

### FLUX 1.1 Pro
- **Speed**: Moderate  
- **Quality**: Top-tier, best prompt adherence
- **Best for**: Final production images, complex prompts

## 🚀 Getting Started Tips

1. **Start with FLUX Schnell** for testing prompts (cheapest)
2. **Use FLUX Dev** for most production work (great quality/price balance)
3. **Save FLUX 1.1 Pro** for your best prompts (premium quality)
4. **Keep DALL-E 3** for when you need OpenAI's specific style

## 🛡️ Security Notes

- Keep your API token secure and never commit it to git
- Replicate tokens have full account access, so treat them like passwords
- You can revoke and recreate tokens anytime in your Replicate dashboard

## 📊 Monitoring Usage

- View your usage at [Replicate Dashboard](https://replicate.com/account)
- Set up billing alerts to monitor spending
- Each model run shows cost and duration in the dashboard

## 🆘 Troubleshooting

### Token Issues
- Ensure token starts with `r8_`
- Check for extra spaces or quotes in `.env.local`
- Verify token is active in Replicate dashboard

### Model Errors
- Some models may have temporary availability issues
- Check [Replicate Status](https://status.replicate.com/) for service updates
- Fall back to DALL-E 3 if Replicate models are unavailable

### Rate Limits
- Replicate has generous rate limits for most users
- Contact Replicate support if you need higher limits
- Consider upgrading to priority queues for faster processing

---

🎉 **You're all set!** Your app now has access to 5 different AI models with varying capabilities and pricing. Choose the right model for each use case to optimize both quality and cost. 