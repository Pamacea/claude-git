#!/bin/bash

# Aureus - Web Interface Launcher

echo "🚀 Starting Aureus Web Interface..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download: https://nodejs.org/"
    exit 1
fi

# Check if dependencies are installed
WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/web" && pwd)"

if [ ! -d "$WEB_DIR/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd "$WEB_DIR"
    npm install
fi

# Start server
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 Aureus - Web Interface                       ║"
echo "║                                                            ║"
echo "║  Opening browser at http://localhost:3747                  ║"
echo "║                                                            ║"
echo "║  Press Ctrl+C to stop                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd "$WEB_DIR"
npm start
