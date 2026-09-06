# Astral Creature Journal & AI Goal Roadmap

> A gamified productivity sanctuary where you nurture mythical companions by achieving daily goals, logging mindful digital reflections, and conquering AI-architected step-by-step roadmaps.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-38b2ac.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-ffca28.svg)](https://firebase.google.com/)
[![Gemini API](https://img.shields.io/badge/Google%20Gemini-Flash%20%26%20Pro-4285f4.svg)](https://aistudio.google.com/)

---

## Overview

**Astral Creature Journal & AI Goal Roadmap** transforms personal goal achievement and daily habits into an enchanting companion RPG. By committing to focused work and reflective journaling, you channel astral energy to hatch and evolve celestial creatures while Gemini acts as your personal curriculum architect and 24/7 learning ally.

### Key Highlights

- **Celestial Creature Evolution**: Hatch mythical pets (Phoenix, Astral Dragon, Celestial Griffin) that gain XP and evolve across levels. At level 5 (500 XP), choose branching specializations (Scholar, Adventurer, Creator).
- **Conversational Goal Discovery ("What do you want to learn or accomplish today?")**: Start with an interactive conversational session or select from curated presets. Gemini synthesizes a tailored day-by-day roadmap and daily focus tasks.
- **Built-in Focus Timer (Pomodoro)**: Configurable focus sessions with audio chimes and celebratory XP rewards upon completion.
- **Mindful Journal & Gemini Reality Check**: Log daily reflections, wins, and obstacles. Connect Google Calendar to perform an empathetic "Reality Check" that balances subjective feelings against objective schedule density.
- **24/7 Gemini Support Mentor**: An always-available learning ally providing conceptual breakdowns, micro-action plans, and motivation.
- **Strict Security Architecture**: All Gemini API calls run securely through a server-side proxy (`server.ts`). Client authentication is verified using Firebase ID tokens, and data is protected by user-scoped Firestore security rules.

---

## Project Structure

```text
├── firestore.rules               # Production Firestore security rules (enforces user isolation)
├── firebase-blueprint.json       # Firestore database schema blueprint
├── firebase-applet-config.example.json # Template for Firebase project configuration
├── .env.example                  # Template for required environment variables
├── .gitignore                    # Git ignore rules (protects keys, credentials, and data)
├── CLOUD_RUN_SECRETS.md          # Guide for Cloud Run & Secret Manager deployment
├── package.json                  # Scripts and dependencies
├── server.ts                     # Full-stack Express backend & API proxy for Gemini
├── server/
│   ├── firebaseAdmin.ts          # Firebase Admin SDK & token authentication middleware
│   ├── geminiService.ts          # Server-side Gemini AI integration
│   ├── progression.ts            # Server-authoritative XP and pet evolution logic
│   └── store.ts                  # Resilient local fallback store
├── src/
│   ├── components/               # React UI views, modals, and creature avatars
│   ├── lib/
│   │   ├── api.ts                # Client API service communicating with Express backend
│   │   ├── firebaseClient.ts     # Client Firebase SDK initialization
│   │   ├── firebaseConfig.ts     # Safe Firebase configuration resolver
│   │   └── googleOAuth.ts        # Google Calendar OAuth client flow
│   ├── types.ts                  # Shared TypeScript interfaces
│   └── utils/                    # Audio effects, creature data, and storage helpers
└── vite.config.ts                # Vite configuration
```

---

## Security & Secrets Policy

This repository is prepared for public GitHub hosting with strict protection of credentials:

1. **No Hardcoded Secrets**: Neither API keys nor service account JSON credentials are committed to the codebase.
2. **Server-Side API Proxy**: `GEMINI_API_KEY` is strictly accessed on the Node.js server (`server/geminiService.ts`) and is never leaked to the browser.
3. **Firestore Security Rules**: User document paths (`/users/{uid}/**`) are strictly guarded by `firestore.rules` ensuring users can only read and write their own data.
4. **Authoritative Progression**: Experience points and creature evolution are verified by the backend server to prevent client manipulation.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or 20+)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A [Google AI Studio](https://aistudio.google.com/) account for a Gemini API key
- A [Firebase](https://firebase.google.com/) project with Firestore and Authentication enabled

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/astral-creature-journal.git
cd astral-creature-journal
```

---

### Step 2: Install Dependencies

```bash
npm install
```

---

### Step 3: Configure Environment Variables

Create your local `.env` file from the example template:

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Server-side Gemini API key (Required)
GEMINI_API_KEY="your-gemini-api-key-here"

# Server Port (Default: 3000)
PORT=3000
NODE_ENV=development

# Firebase Admin Project ID
FIREBASE_PROJECT_ID="your-firebase-project-id"

# Base App URL
APP_URL="http://localhost:3000"

# Client-Side Firebase Configuration (Required for Firebase Auth & Firestore)
VITE_FIREBASE_API_KEY="your-firebase-web-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-firebase-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-firebase-app-id"

# Optional: Google OAuth Client ID (for Google Calendar Reality Check feature)
VITE_GOOGLE_OAUTH_CLIENT_ID="your-oauth-client-id.apps.googleusercontent.com"
```

---

### Step 4: Configure Firebase Client Settings

You can configure Firebase either via the `VITE_FIREBASE_*` environment variables in `.env` (Step 3) or by copying the JSON template:

```bash
cp firebase-applet-config.example.json firebase-applet-config.json
```

Then edit `firebase-applet-config.json` with your Firebase Web App credentials from the Firebase Console (*Project Settings* > *General* > *Your apps*).

> **Note**: `firebase-applet-config.json` is ignored in `.gitignore` to prevent committing project credentials.

---

### Step 5: Deploy Firestore Security Rules

To ensure user data isolation and security, deploy `firestore.rules` to your Firebase project:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize or link your project
firebase use your-firebase-project-id

# Deploy the security rules
firebase deploy --only firestore:rules
```

The rules ensure:
- Users can only read and write their own documents under `/users/{uid}/**`.
- Root-level collections and cross-tenant reads are blocked (`allow read, write: if false`).

---

### Step 6: Run in Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:3000` with the Vite frontend and Express backend running concurrently.

---

### Step 7: Build for Production

To create an optimized production build:

```bash
npm run build
```

This compiles the client-side SPA into `dist/` and bundles `server.ts` into `dist/server.cjs`.

To launch the production server:

```bash
npm start
```

---

## Cloud Run & Secret Manager Deployment

For deploying the containerized application to Google Cloud Run with Google Cloud Secret Manager, refer to the step-by-step guide in [CLOUD_RUN_SECRETS.md](./CLOUD_RUN_SECRETS.md).

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server and Vite development middleware on port 3000 |
| `npm run build` | Builds Vite client assets and bundles `server.ts` into `dist/server.cjs` |
| `npm run start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type-checking without emitting files (`tsc --noEmit`) |
| `npm run clean` | Cleans up the `dist/` directory |

---

## License

This project is licensed under the MIT License.
