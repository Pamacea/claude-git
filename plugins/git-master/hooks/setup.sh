#!/bin/bash

# Aureus - Setup Script
# Makes hook scripts executable

echo "Setting up Aureus hooks..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Make shell scripts executable
chmod +x "$SCRIPT_DIR/pre-git-check.sh"
chmod +x "$SCRIPT_DIR/post-git-operation.sh"
chmod +x "$SCRIPT_DIR/test-hooks.sh"

# Make Node.js scripts executable
chmod +x "$SCRIPT_DIR/pre-git-check.js"
chmod +x "$SCRIPT_DIR/post-git-operation.js"

echo "✓ Hook scripts are now executable"
echo ""
echo "You can test the hooks by running:"
echo "  bash hooks/test-hooks.sh"
echo ""
