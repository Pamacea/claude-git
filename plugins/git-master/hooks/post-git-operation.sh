#!/bin/bash

# Git Flow Master - Post Git Operation Hook
# Runs after Bash commands to handle git-related cleanup

# Only run if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  exit 0
fi

# Get the last command from history
LAST_CMD=$(history 1 | sed 's/^[ ]*[0-9]*[ ]*//')

# Check if it was a git operation that might need cleanup
if [[ "$LAST_CMD" == *"git commit"* ]] || [[ "$LAST_CMD" == *"git merge"* ]]; then
  # Refresh web interface state if running
  if command -v curl &> /dev/null; then
    curl -s "http://localhost:3747/api/state" > /dev/null 2>&1 &
  fi
fi

# Check for post-release operations
if [[ "$LAST_CMD" == *"git tag v"* ]]; then
  # Extract tag name
  TAG=$(echo "$LAST_CMD" | grep -oP 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)

  if [[ -n "$TAG" ]]; then
    # Run post-release hook if it exists
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [[ -f "$SCRIPT_DIR/post-release.sh" ]]; then
      bash "$SCRIPT_DIR/post-release.sh" "$TAG"
    fi
  fi
fi

exit 0
