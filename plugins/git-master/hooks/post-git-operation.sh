#!/bin/bash

# Aureus - Post Git Operation Hook
# Runs after Bash commands to handle git-related cleanup
# Only processes git commands to avoid latency on other commands

# Read JSON input from stdin to get the command
INPUT=$(cat < /dev/stdin)

# Parse the command using jq
if command -v jq &> /dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
else
  # Fallback if jq is not available - exit silently
  exit 0
fi

# Check if this is a git command - exit immediately if not
if [[ ! "$COMMAND" =~ ^git[[:space:]] ]]; then
  exit 0
fi

# Only run if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  exit 0
fi

# Check if it was a git operation that might need cleanup
if [[ "$COMMAND" == *"git commit"* ]] || [[ "$COMMAND" == *"git merge"* ]]; then
  # Refresh web interface state if running
  if command -v curl &> /dev/null; then
    curl -s "http://localhost:3747/api/state" > /dev/null 2>&1 &
  fi
fi

# Check for post-release operations
if [[ "$COMMAND" == *"git tag v"* ]]; then
  # Extract tag name
  TAG=$(echo "$COMMAND" | grep -oP 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)

  if [[ -n "$TAG" ]]; then
    # Run post-release hook if it exists
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [[ -f "$SCRIPT_DIR/post-release.sh" ]]; then
      bash "$SCRIPT_DIR/post-release.sh" "$TAG"
    fi
  fi
fi

exit 0
