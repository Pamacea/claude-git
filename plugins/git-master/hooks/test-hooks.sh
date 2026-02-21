#!/bin/bash

# Test script for git-flow-master hooks
# Verifies that hooks only process git commands

echo "================================"
echo "Aureus - Hook Tests"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_hook() {
  local HOOK_SCRIPT=$1
  local TEST_NAME=$2
  local TEST_INPUT=$3
  local EXPECTED_EXIT=$4

  echo -n "Testing: $TEST_NAME ... "

  # Run the hook with test input
  echo "$TEST_INPUT" | bash "$HOOK_SCRIPT" > /dev/null 2>&1
  EXIT_CODE=$?

  if [ $EXIT_CODE -eq $EXPECTED_EXIT ]; then
    echo -e "${GREEN}PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}FAILED${NC} (exit: $EXIT_CODE, expected: $EXPECTED_EXIT)"
    ((FAILED++))
  fi
}

echo "Testing Pre-ToolUse Hook..."
echo ""

# Test non-git commands (should exit 0 immediately)
test_hook \
  "hooks/pre-git-check.sh" \
  "Non-git command (ls)" \
  '{"tool_name":"Bash","tool_input":{"command":"ls -la"}}' \
  0

test_hook \
  "hooks/pre-git-check.sh" \
  "Non-git command (cat)" \
  '{"tool_name":"Bash","tool_input":{"command":"cat file.txt"}}' \
  0

test_hook \
  "hooks/pre-git-check.sh" \
  "Non-git command (npm)" \
  '{"tool_name":"Bash","tool_input":{"command":"npm install"}}' \
  0

# Test git commands that aren't commits (should exit 0)
test_hook \
  "hooks/pre-git-check.sh" \
  "Git status" \
  '{"tool_name":"Bash","tool_input":{"command":"git status"}}' \
  0

test_hook \
  "hooks/pre-git-check.sh" \
  "Git log" \
  '{"tool_name":"Bash","tool_input":{"command":"git log --oneline -3"}}' \
  0

# Test git commit with invalid format (should exit 2)
test_hook \
  "hooks/pre-git-check.sh" \
  "Invalid commit format" \
  '{"tool_name":"Bash","tool_input":{"command":"git commit -m \"fix: bug fix"}}' \
  2

# Test git commit with valid format (should exit 0)
test_hook \
  "hooks/pre-git-check.sh" \
  "Valid commit format (PATCH)" \
  '{"tool_name":"Bash","tool_input":{"command":"git commit -m \"PATCH: My Project - v1.0.1\""}}' \
  0

# Test git commit --amend (should exit 0, skip validation)
test_hook \
  "hooks/pre-git-check.sh" \
  "Git commit amend (skip validation)" \
  '{"tool_name":"Bash","tool_input":{"command":"git commit --amend"}}' \
  0

echo ""
echo "================================"
echo "Testing Post-ToolUse Hook..."
echo ""

# Test non-git commands (should exit 0 immediately)
test_hook \
  "hooks/post-git-operation.sh" \
  "Non-git command (ls)" \
  '{"tool_name":"Bash","tool_input":{"command":"ls -la"}}' \
  0

test_hook \
  "hooks/post-git-operation.sh" \
  "Non-git command (echo)" \
  '{"tool_name":"Bash","tool_input":{"command":"echo \"test\""}}' \
  0

# Test git commands (should exit 0 and process)
test_hook \
  "hooks/post-git-operation.sh" \
  "Git commit" \
  '{"tool_name":"Bash","tool_input":{"command":"git commit -m \"PATCH: Test - v1.0.0\""}}' \
  0

test_hook \
  "hooks/post-git-operation.sh" \
  "Git status" \
  '{"tool_name":"Bash","tool_input":{"command":"git status"}}' \
  0

echo ""
echo "================================"
echo "Test Results:"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo "================================"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi
