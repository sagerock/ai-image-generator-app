# AI Image Creator

This is a web application for generating AI images from text prompts. It uses the OpenAI DALL-E 3 API for image creation and Firebase for user authentication.

## Features

- **User Authentication**: Sign up and sign in using email and password with Firebase Authentication.
- **Image Generation**: Authenticated users can enter a text prompt to generate an image using OpenAI's DALL-E 3 model.
- **Dynamic UI**: The interface is built with Next.js and Tailwind CSS and dynamically updates based on the user's authentication state.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Model**: [OpenAI DALL-E 3](https://openai.com/dall-e-3)
- **Backend Services**: [Firebase](https://firebase.google.com/) (Authentication)

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- An active [OpenAI API key](https://platform.openai.com/api-keys).
- A [Firebase project](https://console.firebase.google.com/).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env.local` in the root of the project and add the following variables.

    ```env
    # OpenAI API Key
    OPENAI_API_KEY="your-openai-api-key"

    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-firebase-auth-domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-firebase-storage-bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-firebase-messaging-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-firebase-app-id"
    ```
    - You can get your OpenAI key from the [OpenAI Platform dashboard](https://platform.openai.com/api-keys).
    - You can find your Firebase config in your [Firebase project settings](https://console.firebase.google.com/). Remember to enable Email/Password authentication in the Firebase Authentication settings.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application running.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
