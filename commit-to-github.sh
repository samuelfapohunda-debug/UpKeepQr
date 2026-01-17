#!/bin/bash

# ============================================================================
# UpKeepQR - GitHub Commit and Push Script
# ============================================================================

set -e  # Exit on error

echo "🚀 UpKeepQR - GitHub Commit Script"
echo "=================================="
echo ""

# ============================================================================
# STEP 1: CHECK .gitignore
# ============================================================================

echo "📋 Step 1/5: Checking .gitignore..."
echo ""

if [ ! -f .gitignore ]; then
    echo "⚠️  .gitignore not found. Creating one..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.log

# Next.js
.next/
out/
build/
dist/

# Environment files (CRITICAL - never commit these)
.env
.env.local
.env.production
.env.development

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Replit
.replit
replit.nix
.upm/
EOF
    echo "✅ .gitignore created"
else
    echo "✅ .gitignore exists"
fi

echo ""

# ============================================================================
# STEP 2: INITIALIZE GIT
# ============================================================================

echo "📋 Step 2/5: Initializing Git..."
echo ""

if [ ! -d .git ]; then
    git init
    git branch -M main
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Configure git user if needed
if [ -z "$(git config user.name)" ]; then
    read -p "Enter your Git name: " git_name
    git config user.name "$git_name"
fi

if [ -z "$(git config user.email)" ]; then
    read -p "Enter your Git email: " git_email
    git config user.email "$git_email"
fi

echo "✅ Git configured: $(git config user.name) <$(git config user.email)>"
echo ""

# ============================================================================
# STEP 3: STAGE FILES
# ============================================================================

echo "📋 Step 3/5: Staging files..."
echo ""

git add .
echo "✅ Files staged"
echo ""

echo "📊 Files to be committed:"
git status --short
echo ""

# ============================================================================
# STEP 4: COMMIT
# ============================================================================

echo "📋 Step 4/5: Creating commit..."
echo ""

if [ -z "$(git status --porcelain)" ]; then
    echo "ℹ️  No changes to commit"
else
    echo "💬 Enter commit message (or press Enter for default):"
    read -p "> " commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="feat: Complete UpKeepQR MVP implementation

- QR code purchase flow with Stripe
- Setup form with dual access  
- Email system with Resend
- SMS reminders with Twilio
- JWT authentication
- Rate limiting and security
- Database with Drizzle ORM
- Redis caching

Tested in Replit"
    fi
    
    git commit -m "$commit_message"
    echo "✅ Committed"
fi

echo ""

# ============================================================================
# STEP 5: PUSH TO GITHUB
# ============================================================================

echo "📋 Step 5/5: Pushing to GitHub..."
echo ""

if git remote get-url origin &>/dev/null; then
    echo "✅ Remote exists: $(git remote get-url origin)"
else
    echo "🔧 No remote found"
    read -p "Enter GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
    echo "✅ Remote added"
fi

echo ""
echo "🚀 Pushing to GitHub..."
echo ""

if git push -u origin main 2>&1; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Done! Check your repository on GitHub."
else
    echo ""
    echo "⚠️  Push failed. Try:"
    echo "   git pull origin main --rebase"
    echo "   git push -u origin main"
    echo ""
    echo "Or use Personal Access Token for authentication"
fi

