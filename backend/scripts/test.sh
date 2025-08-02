#!/bin/bash

# Test runner script for Trade Bot
# Automatically uses .env.test via NODE_ENV=test

set -e

echo "🧪 Running Trade Bot Tests"
echo "=========================="
echo "Using test environment: NODE_ENV=test"

# Run unit tests
echo "📋 Running Unit Tests..."
NODE_ENV=test bun test src/tests/unit/

# Run integration tests
echo "🔗 Running Integration Tests..."
NODE_ENV=test bun test src/tests/integration/

# Run E2E tests if Playwright is available
if command -v playwright &> /dev/null; then
    echo "🎭 Running E2E Tests..."
    NODE_ENV=test bunx playwright test --config=config/playwright.config.ts
else
    echo "⚠️  Playwright not found, skipping E2E tests"
    echo "   Install with: bun install -g @playwright/test"
fi

echo "✅ All tests completed!"