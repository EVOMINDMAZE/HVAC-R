#!/bin/bash

echo "🚀 HVAC-R Production Deployment Script"
echo "======================================="

# Check if build exists
if [ ! -d "dist/spa" ]; then
    echo "❌ Build not found. Running build..."
    npm run build
fi

echo "✅ Build verified"

# Option 1: Deploy to Netlify (Static + Functions)
echo ""
echo "📦 Option 1: Netlify Deployment"
echo "------------------------------"
echo "1. Open https://app.netlify.com/sites"
echo "2. Click 'Add new site' → 'Import an existing project'"
echo "3. Select this repository"
echo "4. Build settings:"
echo "   - Build command: npm run build"
echo "   - Publish directory: dist/spa"
echo "5. Add environment variables:"
echo "   VITE_SUPABASE_URL=https://rxqflxmzsqhqrzffcsej.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""

# Option 2: Deploy to Fly.io (Full Stack)
echo ""
echo "🐱 Option 2: Fly.io Deployment (Full Stack)"
echo "-------------------------------------------"
echo "1. Install Fly CLI: curl -L https://fly.io/install.sh | sh"
echo "2. Login: fly auth login"
echo "3. Launch: fly launch"
echo "4. Deploy: fly deploy"
echo ""

# Option 3: Deploy to Render (Full Stack)
echo ""
echo "🎨 Option 3: Render Deployment (Full Stack)"
echo "--------------------------------------------"
echo "1. Open https://dashboard.render.com"
echo "2. Click 'New' → 'Web Service'"
echo "3. Connect GitHub repository"
echo "4. Configure:"
echo "   - Build command: npm run build"
echo "   - Start command: npm run start"
echo "   - Environment variables:"
echo "     VITE_SUPABASE_URL=https://rxqflxmzsqhqrzffcsej.supabase.co"
echo "     VITE_SUPABASE_ANON_KEY=..."
echo ""

# Deploy now with Netlify CLI
echo "🔥 Deploying to Netlify now..."
netlify deploy --dir=dist/spa --prod

echo ""
echo "✅ Deployment complete!"
echo "📝 Don't forget to add environment variables in Netlify dashboard"
