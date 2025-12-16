#!/bin/bash

# Открыть страницу создания PR

PR_URL="https://github.com/athebyme/finance-tracking-app/pull/new/claude/finance-tracker-merged-X3IC4"

echo "🚀 Открываю страницу создания Pull Request..."
echo ""
echo "URL: $PR_URL"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$PR_URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$PR_URL" 2>/dev/null || gnome-open "$PR_URL" 2>/dev/null || echo "Скопируйте ссылку вручную: $PR_URL"
else
    echo "Скопируйте эту ссылку: $PR_URL"
fi

echo "✅ Готово!"
