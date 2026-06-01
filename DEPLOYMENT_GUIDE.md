# 🚀 Deploy Your Rhythm App to Vercel

## Step 1: Download Your Code from Figma Make

### In Figma Make:
1. Look for **"Export"** or **"Download"** button (usually in top menu)
2. Or use **File > Export** or similar menu option
3. This downloads a `.zip` file with all your code

### Alternative - Manual Download:
If there's no export button, you can download from this workspace:

**Files you need:**
```
your-rhythm-app/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── components/
│   ├── styles/
│   │   ├── theme.css
│   │   └── fonts.css
│   └── utils/
│       └── pwa.ts
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icon.svg
├── package.json
├── vite.config.ts
├── tsconfig.json
└── postcss.config.mjs
```

## Step 2: Prepare for Standard Deployment

Since Figma Make uses a custom build system, you need to create a few files:

### Create `index.html` in root:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#d4a59a" />
    <meta name="description" content="Track your energy, mood, cycle, and tasks in tune with your natural rhythm" />
    <link rel="manifest" href="/manifest.json" />
    <title>Your Rhythm</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Create `src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Update `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  build: {
    outDir: 'dist',
  },
})
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Website (Easiest)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** (use GitHub account recommended)
3. **Click "Add New Project"**
4. **Import from Git** or **Upload folder directly**
5. Vercel auto-detects Vite and configures everything
6. **Click "Deploy"**
7. Done! You get a URL like `yourrhythm.vercel.app`

### Option B: Deploy via Command Line

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to your project folder
cd your-rhythm-app

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? your-rhythm
# - Directory? ./
# - Build command? npm run build
# - Output directory? dist
```

## Step 4: Custom Domain (Optional)

In Vercel dashboard:
1. Go to your project
2. Click "Settings" > "Domains"
3. Add your custom domain (e.g., `yourrhythm.app`)
4. Follow DNS instructions from your domain registrar

## Troubleshooting

### If build fails:
```bash
# Make sure all dependencies are installed
npm install

# Test build locally first
npm run build

# Test the build
npm run preview
```

### Common issues:
- **Missing index.html**: Make sure it's in root directory
- **Missing main.tsx**: Create the entry point file
- **Build errors**: Check that all imports in App.tsx are correct

## What Happens After Deploy

✅ Your app is live at `yourrhythm.vercel.app`
✅ Users can visit and install as PWA
✅ Auto-deploys when you push updates (if using Git)
✅ Free SSL certificate (HTTPS)
✅ Global CDN for fast loading
✅ All PWA features work perfectly

## Share Your App

Once deployed, share the URL:
- Direct link: `https://yourrhythm.vercel.app`
- QR code (generate at qr-code-generator.com)
- Social media
- Text/email

Users visit the link → See install prompt → Install to home screen!

---

**Need help?** Let me know which step you're stuck on!
