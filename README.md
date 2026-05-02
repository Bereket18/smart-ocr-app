# Welcome to your Expo app 👋

# 📄 Smart OCR — AI-Powered Mobile Scanner

> Scan any document with your phone camera. Extract text instantly. Summarize with AI. Translate to 11 languages. Export anywhere.

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2054-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Firebase](https://img.shields.io/badge/Firebase-v12-orange)
![Version](https://img.shields.io/badge/version-1.0.0-green)

---

## 📱 Screenshots

> Coming soon — demo video and screenshots

---

## ✨ Features

### Core OCR

- 📷 **Camera capture** — Full-screen camera with document corner guides
- 🖼️ **Gallery upload** — Pick any image from your photo library
- 🔍 **Google Cloud Vision OCR** — Industry-leading text extraction accuracy
- 🌐 **Language detection** — Automatically detects 100+ languages
- ✏️ **Editable text** — Edit extracted text with undo/redo/reset stack

### AI & Translation

- ✨ **AI Summarization** — Groq (Llama 3) generates 5-bullet summaries instantly
- 🌍 **Translation** — Google Translate supports 11 languages including Amharic
- 📋 **Copy to clipboard** — One tap to copy all extracted text

### Cloud & Storage

- 🔐 **Email/Password Auth** — Firebase Authentication with session persistence
- ☁️ **Cloud sync** — Scans saved to Firebase Firestore and Storage
- 📜 **Scan history** — Full history with pull-to-refresh
- 🗑️ **Delete scans** — Remove from cloud and local state

### Export

- 📄 **Export as TXT** — Plain text file via iOS share sheet
- 📋 **Export as PDF** — Formatted PDF document
- 📤 **Share anywhere** — iOS share sheet to any app

### Advanced

- 📶 **Offline detection** — Shows status and queues saves with AsyncStorage
- 🌙 **Dark / Light mode** — Full theme switching across all screens
- 🔎 **Search history** — Filter scans by content or language

---

## 🛠️ Tech Stack

| Layer        | Technology                   |
| ------------ | ---------------------------- |
| Framework    | React Native + Expo SDK 54   |
| Language     | TypeScript                   |
| Navigation   | Expo Router v3 (file-based)  |
| State        | Zustand v4                   |
| OCR          | Google Cloud Vision API      |
| OCR Fallback | ML Kit (after EAS Build)     |
| AI Summary   | Groq API — Llama 3.3 70B     |
| Translation  | Google Cloud Translation API |
| Database     | Firebase Firestore           |
| Storage      | Firebase Storage             |
| Auth         | Firebase Authentication      |
| Offline      | AsyncStorage + NetInfo       |
| Export       | expo-print + expo-sharing    |

---

## 🏗️ Architecture

```
app/                    ← Expo Router screens
├── _layout.tsx         ← Root layout + auth guard
├── login.tsx           ← Login and register
├── camera.tsx          ← Full-screen camera
├── results.tsx         ← OCR results + AI + translate
└── (tabs)/
    ├── index.tsx       ← Home screen
    ├── history.tsx     ← Scan history + search
    └── settings.tsx    ← Settings + theme + auth

src/
├── components/         ← Reusable UI components
├── hooks/              ← Business logic (useOCR, useFirebase, useAI...)
├── services/           ← External API wrappers
├── store/              ← Zustand global state
├── types/              ← TypeScript interfaces
├── constants/          ← Design tokens (colors, typography)
└── utils/              ← Pure helper functions
```

### Layer Rules

- **UI** → calls hooks only, never APIs directly
- **Hooks** → coordinate services and state
- **Services** → pure API wrappers, no React
- **Store** → global state, immutable updates only

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Expo Go app on your iPhone or Android device

### Installation

```bash
git clone https://github.com/Bereket18/smart-ocr-app.git
cd smart-ocr-app
npm install
```

### Environment Setup

Create a `.env` file in the root:

```
EXPO_PUBLIC_GOOGLE_VISION_KEY=your_google_vision_key
EXPO_PUBLIC_TRANSLATE_KEY=your_google_translate_key
EXPO_PUBLIC_GROQ_KEY=your_groq_key
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Run

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone.

---

## 📡 API Integrations

| API                 | Purpose             | Free Tier           |
| ------------------- | ------------------- | ------------------- |
| Google Cloud Vision | OCR text extraction | 1,000 units/month   |
| Google Translate    | Text translation    | 500,000 chars/month |
| Groq (Llama 3)      | AI summarization    | Generous free tier  |
| Firebase Auth       | User authentication | Free                |
| Firebase Firestore  | Cloud database      | 50,000 reads/day    |
| Firebase Storage    | Image storage       | 1GB                 |

---

## 📦 Project Phases

| Phase              | Features                             | Status      |
| ------------------ | ------------------------------------ | ----------- |
| Phase 1 — Core OCR | Camera, OCR, text editor             | ✅ Complete |
| Phase 2 — Cloud    | Firebase auth, save, history, export | ✅ Complete |
| Phase 3 — AI       | Summarization, translation           | ✅ Complete |
| Phase 4 — Advanced | Offline mode, dark/light theme       | ✅ Complete |
| Phase 5 — Polish   | Search, icon, README                 | ✅ Complete |

---

## 🔐 Security

- All API keys stored in `.env` — never committed to Git
- Firebase Security Rules restrict data access per authenticated user
- Images compressed before upload — max ~300KB
- Anonymous users cannot access other users' data

---

## 👨‍💻 Developer

**Bereket** — JavaScript developer learning TypeScript through hands-on project building.

Built with React Native, Expo, Firebase, and AI APIs over 5 phases and 13 sprints following a full SDLC process.

---

## 📄 License

MIT License — feel free to use this project as a reference or learning resource.

---

_Smart OCR v1.0.0 — Built with ❤️ using React Native + Expo_

BEREKET ADAMSSEGED ASRESSBEREKET ADAMSSEGED ASRESS

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
