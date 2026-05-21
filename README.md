# NutriScan 🍏

> An AI-powered photo nutrition tracker and biometric calorie calculator that helps you stay healthy and log meals instantly.

[![Demo](https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000)](https://ais-pre-6f3sh3uwsdpttli3kfwz5z-475865223899.europe-west1.run.app)

> Click the image to view the demo. The link will open in the current tab (press `Ctrl + Click` or `Cmd + Click` to open in a new tab).

## Description

**NutriScan** is a secure, full-stack application designed to make nutrition tracking effortless. By leveraging modern AI vision models, users can simply upload a photo or describe their meal to instantly receive estimated weights, volumes, calorie counts, macronutrient breakdowns, and expert nutritionist feedback. 

Additionally, the application includes a personalized biometric calculator (TDEE) to customize and calculate daily nutrition budget allocations, an interactive meal history log, and a quick fluid intake tracker. 

All user data is fully synced instantly via Google Firebase Authentication & Firebase Firestore to the cloud, allowing users to track their goals seamlessly across different devices.

## Features

### For Everyone
- **AI Photo Nutrient Scan**: Take or select a photo of your meal and let the AI instantly analyze portion weights, fluid volumes, calory content, and individual ingredients.
- **Smart Text Analysis**: Describe your meal in plain words, and the AI nutritionist will break down individual nutrients.
- **Biometric TDEE Calculator**: Enter your physical properties (height, weight, age, activity level) and customized targets (weight loss, maintenance, or weight gain) to instantly establish personalized daily limits.
- **Intuitive Nutrient Progress**: Interactive, real-time charts displaying consumed vs. remaining carbs, proteins, fats, and total calories.
- **Quick Water Tracker**: A fast, convenient tap-to-add tracker with custom benchmarks to ensure regular hydration.
- **Bilingual Interface**: Seamless Ukranian (**УКР**) and English (**ENG**) toggles with local client state memory.
- **Dynamic Color Themes**: Flexible light & eye-safe dark mode preferences to fit your ambient environment.

### Under the Hood
- **Secure Cloud Sync**: Auto-saved cloud backups utilizing Firestore document channels.
- **Offline Migration Onboarding**: Automatic background import migration from legacy browser `localStorage` on first signIn.
- **Secure API Proxies**: Keeps proprietary GenAI API keys 100% hidden on the Node server, securely handling multi-modal analysis.

## Technologies Used

- **React 19** – Declarative React UI framework built with custom state hooks
- **Vite 6** – Fast modular modulebundling and development server
- **Tailwind CSS v4** – Modern high-performance utility class framework
- **Firebase 12** – Google User Authentication & Firestore persistent real-time database
- **Google GenAI SDK** – Direct server relations with Gemini models for vision-backed analysis
- **Motion / Framer Motion** – High-fluidity layout entrances and list animations
- **Express 4 & Server Integration** – Backend API orchestration
- **Lucide React** – Vibrant modern vector icon pack

## What I Practiced

- **Secure API Design**: Moving vulnerable API keys to custom Node.js/Express proxy endpoints, preventing browser credential exposure.
- **Real-Time Data Streaming**: Establishing synchronized, real-time Firestore collection snapshot listeners that instantly auto-save diaries.
- **Smooth Content Transitions**: Incorporating modular spring physics layouts for list additions, calculator toggles, and state transitions.
- **Responsive Workspace**: Building complex, adaptive structures designed for desktop viewports down to single-hand mobile usage.
- **Localization Integration**: Mapping and managing deep bilingual string dictionaries across local schemas.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm 

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/nutriscan.git
cd nutriscan
```

2. Install dependencies:

```bash
npm install
```

3. Create your `.env` configuration file and declare your credentials:

```env
# .env file
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## How to Use

1. **Calculate Goals**: Open the "Daily Allowance Calculator" to set up your customized macronutrient targets.
2. **Scan Meal**: Navigate to the upload area, select or drop a picture of a meal, and click **Start AI Nutrient Scan**.
3. **Log & Edit**: Double check the estimated results, rename items if required, or add components manually, and click **Add to Diary**.
4. **Log Water**: Use the Quick Water Tracker at the bottom to log fluid intake instantly.
** **Shift Days**: Navigate forward or backward to review historical calendars and check past achievements.
