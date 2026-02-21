#!/bin/bash

# Aureus - Pre Git Commit Check Hook
# Validates git commit messages against Versioned Release Convention
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

# Only validate git commit commands (not amend)
if [[ "$COMMAND" =~ ^git[[:space:]]commit ]] && [[ ! "$COMMAND" =~ --amend ]]; then
  # Check if jq is available for parsing
  if ! command -v jq &> /dev/null; then
    exit 0
  fi

  # Extract commit message from command
  # Handle: git commit -m "message" or git commit -m'message'
  if [[ "$COMMAND" =~ -m[[:space:]]['\"](.+)['\"] ]]; then
    COMMIT_MSG="${BASH_REMATCH[1]}"
  else
    # If no -m flag, commit will open editor - allow it
    exit 0
  fi

  # Validate Versioned Release Convention format
  # Format: TYPE: PROJECT NAME - vVERSION
  # Types: RELEASE, UPDATE, PATCH

  # Check if it matches the pattern
  if [[ ! "$COMMIT_MSG" =~ ^(RELEASE|UPDATE|PATCH):[[:space:]]+[[:print:]]+-[[:space:]]+v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
    # Invalid format - output error to stderr
    echo "❌ Invalid commit message format!" >&2
    echo "" >&2
    echo "Required format:" >&2
    echo "  TYPE: PROJECT NAME - vVERSION" >&2
    echo "" >&2
    echo "Types: RELEASE, UPDATE, PATCH" >&2
    echo "Example: UPDATE: My Project - v1.1.0" >&2
    echo "" >&2
    echo "Run /suggest-version for version recommendations." >&2
    exit 2  # Non-zero exit code blocks the command
  fi
fi

# Allow the command to proceed
exit 0
