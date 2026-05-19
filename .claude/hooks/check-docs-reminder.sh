#!/bin/bash
# PostToolUse hook: prints a reminder when core project files are modified.
# Receives tool call JSON on stdin.

input=$(cat)
path=$(echo "$input" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null)

if echo "$path" | grep -qE "frontend/app/|frontend/lib/|package\.json"; then
  echo ""
  echo "Project structure or core logic changed. Consider running /update-claude-md to keep documentation in sync."
fi
