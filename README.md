# AI Image Creator

A modern, beautiful web application for generating AI images from text prompts. Built with Next.js, TypeScript, and powered by OpenAI's DALL-E 3 API with Firebase authentication.

![AI Image Creator](https://img.shields.io/badge/Next.js-15.3.4-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC) ![Firebase](https://img.shields.io/badge/Firebase-Auth-orange)

## ✨ Features

### 🎨 **Image Generation**
- Generate high-quality images using OpenAI's DALL-E 3 model
- Support for multiple AI models (DALL-E 3, Stable Diffusion, Leonardo AI)
- Real-time image generation with loading states and progress indicators
- Intuitive text prompt interface with helpful placeholders

### 🔐 **User Authentication**
- Secure email/password authentication via Firebase
- Beautiful, modern sign-up and sign-in forms
- Protected routes and user session management
- Seamless authentication state handling

### 🖼️ **Gallery & UI**
- Personal gallery page to view generated images (placeholder implementation)
- Modern, responsive design with gradient backgrounds
- Professional card-based layouts
- Smooth animations and hover effects
- Mobile-first responsive design
- Dark mode support

### 🎯 **User Experience**
- Clean, intuitive interface with professional styling
- Loading states and error handling
- Smooth transitions and animations
- Accessible design patterns

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15.3.4](https://nextjs.org/) with TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom utilities
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **AI Integration**: [OpenAI DALL-E 3 API](https://openai.com/dall-e-3)
- **Development**: Turbopack for fast development builds
- **Deployment Ready**: Optimized for Vercel deployment

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or later recommended)
- **npm** or **yarn**
- **OpenAI API key** - Get yours at [OpenAI Platform](https://platform.openai.com/api-keys)
- **Firebase project** - Create one at [Firebase Console](https://console.firebase.google.com/)

### 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd image-creator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable **Authentication** and set up **Email/Password** provider
   - Get your Firebase configuration from Project Settings

4. **Set up environment variables:**
   Create a `.env.local` file in the root directory:

   ```env
   # OpenAI Configuration
   OPENAI_API_KEY="your-openai-api-key-here"

   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 UI Highlights

The application features a modern, professional design with:

- **Gradient Backgrounds**: Beautiful blue-to-purple gradients
- **Card-Based Layout**: Clean, elevated content containers
- **Interactive Elements**: Hover effects and smooth transitions
- **Professional Typography**: Gradient text effects and clear hierarchy
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Loading States**: Engaging animations and progress indicators

## 📱 Pages & Routes

- **`/`** - Main image generation interface
- **`/gallery`** - Personal gallery of generated images
- **Authentication flows** - Integrated sign-up/sign-in modals

## 🔧 Project Structure

```
src/
├── app/
│   ├── api/generate/     # Image generation API endpoint
│   ├── gallery/          # Gallery page
│   ├── globals.css       # Global styles and Tailwind imports
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Main image generation page
├── components/
│   ├── Auth.tsx          # Authentication form component
│   └── AuthProvider.tsx  # Firebase auth context provider
└── lib/
    ├── firebase.ts       # Firebase client configuration
    └── firebase-admin.ts # Firebase admin SDK (for future storage)
```

## 🚧 Current Status & Known Issues

### ✅ Working Features
- ✅ User authentication (sign up/sign in/sign out)
- ✅ Image generation with DALL-E 3
- ✅ Modern, responsive UI design
- ✅ Gallery page layout
- ✅ Error handling and loading states

### 🔄 In Development
- 🔄 Image storage and persistence (Firebase Admin SDK integration in progress)
- 🔄 Full gallery functionality with real user images
- 🔄 Additional AI model integrations
- 🔄 Image download and sharing features

### ⚠️ Known Issues
- Firebase Admin SDK initialization issues preventing image storage
- Gallery currently shows placeholder data
- Generated images are temporary URLs (not persisted)

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push your code to GitHub**

2. **Connect to Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables in Vercel dashboard

3. **Set environment variables in Vercel:**
   Add all the variables from your `.env.local` file to your Vercel project settings

4. **Deploy:**
   Vercel will automatically build and deploy your application

### Alternative Deployment Options
- **Firebase Hosting**: For static hosting
- **Render**: For full-stack deployment
- **Railway**: For containerized deployment

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for the DALL-E 3 API
- [Firebase](https://firebase.google.com/) for authentication services
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

---

**Made with ❤️ and AI** - Generate beautiful images with the power of artificial intelligence!
