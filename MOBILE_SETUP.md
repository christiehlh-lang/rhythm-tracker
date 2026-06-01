# Mobile App Development Setup

## Current Environment
This app is built in **Figma Make**, which is optimized for web app development. It uses a custom build system that differs from standard React projects.

## Options for Mobile Development

### Option 1: Export to Standard React Project (Recommended for Native Apps)

To build true iOS/Android apps, you'll need to migrate this to a standard React + Vite project:

1. **Create a new standard React + Vite project:**
   ```bash
   npm create vite@latest your-rhythm-mobile -- --template react-ts
   cd your-rhythm-mobile
   ```

2. **Copy your source files:**
   - Copy `src/app/` folder
   - Copy `src/styles/` folder
   - Copy `package.json` dependencies

3. **Create index.html:**
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Your Rhythm</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>
   ```

4. **Create src/main.tsx:**
   ```tsx
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import App from './app/App'
   import './styles/theme.css'
   import './styles/fonts.css'

   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>,
   )
   ```

5. **Install Capacitor:**
   ```bash
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/ios @capacitor/android
   ```

6. **Initialize Capacitor:**
   ```bash
   npx cap init "Your Rhythm" "com.yourrhythm.app" --web-dir=dist
   ```

7. **Build and add platforms:**
   ```bash
   npm run build
   npx cap add ios
   npx cap add android
   npx cap sync
   ```

8. **Open in native IDEs:**
   - iOS: `npx cap open ios` (requires Xcode on Mac)
   - Android: `npx cap open android` (requires Android Studio)

### Option 2: Progressive Web App (PWA) - Works in Figma Make

Stay in Figma Make and make the app installable on mobile devices:

1. **Add PWA manifest** (see below)
2. **Add service worker** (see below)
3. Users can install directly from their mobile browser

### Option 3: Continue Development in Figma Make

Keep developing here and export later when ready for mobile deployment. All your code will be portable.

## PWA Setup (Works Now in Figma Make)

I can set up a PWA for you right now, which allows users to:
- Install the app on their phone home screen
- Use it offline
- Get a native-like experience

Would you like me to set up the PWA option?

## Mobile-Specific Features to Add

Once you migrate to Capacitor or use PWA, you can add:
- **Push notifications** for cycle reminders
- **Local storage** for offline data sync
- **Haptic feedback** for better mobile UX
- **Native calendar integration**
- **Biometric authentication** for privacy
- **Camera access** for importing documents

## Next Steps

Let me know which option you'd like to pursue:
1. PWA setup (I can do this now in Figma Make)
2. Help you prepare files for migration to standard React project
3. Document the code for future mobile development
