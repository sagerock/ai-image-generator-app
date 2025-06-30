# AI Image Creator

A modern, beautiful web application for generating AI images from text prompts. Built with Next.js, TypeScript, and powered by OpenAI's DALL-E 3 API with complete Firebase integration for authentication, storage, and user galleries.

![AI Image Creator](https://img.shields.io/badge/Next.js-15.3.4-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC) ![Firebase](https://img.shields.io/badge/Firebase-Full_Stack-orange) ![OpenAI](https://img.shields.io/badge/OpenAI-DALL--E_3-green)

## ✨ Features

### 🎨 **AI Image Generation**
- **High-quality image generation** using OpenAI's DALL-E 3 model
- **Real-time generation** with loading states and progress indicators
- **Intuitive text prompt interface** with helpful placeholders
- **Persistent image storage** in Firebase Cloud Storage
- **Automatic metadata saving** to Firestore database

### 🔐 **User Authentication**
- **Secure email/password authentication** via Firebase Auth
- **Beautiful, modern sign-up and sign-in forms** with error handling
- **Forgot password functionality** with email reset links
- **Complete password reset flow** with email verification
- **Protected routes** and user session management
- **Seamless authentication state handling** across the app

### 🖼️ **Personal Gallery**
- **Real user gallery** displaying all your generated images
- **Persistent image storage** with Firebase Cloud Storage
- **Image metadata tracking** (prompts, creation dates, models used)
- **User-specific galleries** - each user sees only their own images
- **Responsive grid layout** with professional card design
- **Real-time updates** when new images are generated

### 🎯 **User Experience**
- **Modern, responsive design** with gradient backgrounds and animations
- **Professional card-based layouts** with hover effects
- **Loading states and error handling** throughout the app
- **Mobile-first responsive design** that works on all devices
- **Smooth transitions and animations** for enhanced UX

### 🛡️ **Security & Performance**
- **Production-ready Firebase security rules** for Firestore and Storage
- **User data isolation** - users can only access their own content
- **Proper authentication verification** on all API endpoints
- **File size and type validation** for uploaded images
- **Optimized image storage** with public read access for sharing

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15.3.4](https://nextjs.org/) with TypeScript and Turbopack
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom utilities and gradients
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth) with email/password
- **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore) for image metadata
- **Storage**: [Firebase Cloud Storage](https://firebase.google.com/docs/storage) for image files
- **AI Integration**: [OpenAI DALL-E 3 API](https://openai.com/dall-e-3) for image generation
- **Backend**: Firebase Admin SDK for server-side operations
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

3. **Set up Firebase (Required):**
   
   **Follow the complete setup guide in [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md)**
   
   Quick overview:
   - Create Firebase project
   - Enable Authentication (Email/Password)
   - Enable Cloud Firestore (start in test mode)
   - Enable Firebase Storage (start in test mode)
   - Create service account and download JSON key
   - Apply security rules (provided in the setup guide)

4. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory (use `env.template` as reference):

   ```env
   # OpenAI Configuration
   OPENAI_API_KEY="sk-your-openai-api-key-here"

   # Firebase Web App Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

   # Firebase Admin SDK Configuration
   FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 UI Highlights

The application features a modern, professional design with:

- **Gradient Backgrounds**: Beautiful blue-to-purple gradients throughout
- **Card-Based Layout**: Clean, elevated content containers with shadows
- **Interactive Elements**: Smooth hover effects and transitions
- **Professional Typography**: Gradient text effects and clear hierarchy
- **Responsive Design**: Seamless experience on desktop, tablet, and mobile
- **Loading States**: Engaging animations and progress indicators
- **Error Handling**: User-friendly error messages and retry options

## 📱 Pages & Features

- **`/`** - Main image generation interface with authentication
- **`/gallery`** - Personal gallery of all your generated images
- **`/reset-password`** - Password reset page for handling email reset links
- **Authentication flows** - Integrated sign-up/sign-in with error handling
- **Password recovery** - Complete forgot password flow with email verification
- **Real-time updates** - Gallery updates immediately after image generation
- **Image persistence** - All images permanently stored in Firebase

## 🔧 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/         # Image generation API endpoint
│   │   └── gallery/          # Gallery API endpoint
│   ├── gallery/              # Gallery page component
│   ├── globals.css           # Global styles and Tailwind imports
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Main image generation page
├── components/
│   ├── Auth.tsx              # Authentication form component
│   ├── AuthProvider.tsx      # Firebase auth context provider
│   ├── ForgotPassword.tsx    # Password reset component
│   └── Notification.tsx      # Toast notification system
└── lib/
    ├── firebase.ts           # Firebase client configuration
    └── firebase-admin.ts     # Firebase admin SDK configuration

# Configuration Files
├── FIREBASE_SETUP.md         # Complete Firebase setup guide
├── env.template              # Environment variables template
├── firestore.rules           # Firestore security rules
├── storage.rules             # Firebase Storage security rules
└── .env.local                # Your environment variables (not in repo)
```

## 🚧 Current Status

### ✅ **Fully Working Features**
- ✅ **User authentication** (sign up/sign in/sign out)
- ✅ **Password reset functionality** with email verification
- ✅ **AI image generation** with DALL-E 3
- ✅ **Persistent image storage** in Firebase Cloud Storage
- ✅ **Real user galleries** with actual generated images
- ✅ **Firestore database integration** for image metadata
- ✅ **Modern, responsive UI design** with animations
- ✅ **Toast notification system** for user feedback
- ✅ **Error handling and loading states** throughout
- ✅ **Production-ready security rules** for Firebase
- ✅ **User data isolation** and proper authentication
- ✅ **Real-time gallery updates** after image generation

### 🔄 **Potential Future Enhancements**
- 🔄 Additional AI model integrations (Stable Diffusion, Leonardo AI)
- 🔄 Image download and sharing features
- 🔄 Image editing and manipulation tools
- 🔄 Social features (public galleries, likes, comments)
- 🔄 Advanced prompt templates and suggestions
- 🔄 Image collections and favorites
- 🔄 Usage analytics and generation history

### ⚠️ **Known Notes**
- Firebase indexes are created automatically when needed
- Images are stored publicly for easy sharing
- Generated images use OpenAI's standard quality setting
- Gallery is sorted by creation date (newest first)

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

- [OpenAI](https://openai.com/) for the incredible DALL-E 3 API
- [Firebase](https://firebase.google.com/) for the complete backend infrastructure
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vercel](https://vercel.com/) for seamless deployment platform

---

**Made with ❤️ and AI** - Transform your ideas into stunning visuals with the power of artificial intelligence!

## 📞 Support

If you encounter any issues during setup or usage:

1. **Check the [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md)** guide for detailed Firebase configuration
2. **Review the [`env.template`](./env.template)** file for required environment variables
3. **Check browser console** for client-side errors
4. **Check terminal console** for server-side errors
5. **Verify Firebase services** are enabled in the Firebase Console

**Your AI Image Creator is ready to bring your imagination to life!** 🎨✨
