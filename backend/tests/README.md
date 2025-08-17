# Tests

This folder contains test files for the trade-bot application.

## Test Structure
- **Unit tests**: `backend/src/tests/unit/` - Individual function/module tests
- **Integration tests**: `backend/src/tests/integration/` - Database & external service tests  
- **E2E tests**: `backend/src/tests/e2e/` - Complete workflow tests with Playwright

## Quick Commands
```bash
# Run all tests
bun test

# Run specific test types
bun test tests/unit/          # Unit tests only
bun test tests/integration/   # Integration tests only
bunx playwright test              # E2E tests

# Watch mode & coverage
bun test --watch                  # Watch mode
bun test --coverage              # With coverage
```

### All Tests

```bash
# Make test script executable (first time only)
chmod +x scripts/test.sh

# Run all tests
./scripts/test.sh
```

## Environment
Tests use `.env.test` for configuration. Bun automatically loads this when `NODE_ENV=test`.
