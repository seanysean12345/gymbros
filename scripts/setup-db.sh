#!/bin/bash
# GymBros Database Setup Script
# Usage: ./scripts/setup-db.sh

set -e

echo "🏋️ GymBros Database Setup"
echo "========================="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    brew install supabase/tap/supabase
fi

# Check for required env vars
if [ -z "$SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo ""
    echo "Please set these environment variables first:"
    echo "  export SUPABASE_PROJECT_ID=bglhdrlpyycdlebeeaxk"
    echo "  export SUPABASE_DB_PASSWORD=<your-database-password>"
    echo ""
    echo "You can find your database password in:"
    echo "  Supabase Dashboard → Project Settings → Database → Connection string"
    exit 1
fi

# Link to remote project
echo "Linking to Supabase project..."
supabase link --project-ref $SUPABASE_PROJECT_ID

# Push migrations
echo "Running migrations..."
supabase db push

echo ""
echo "✅ Database setup complete!"
echo "Your GymBros app is ready to use."
