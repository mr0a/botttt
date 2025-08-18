# Trade Bot Backend

## Database Setup

This backend uses Bun's built-in SQLite database for development and testing.

### Quick Start

1. Install dependencies:

   ```bash
   bun install
   ```

2. Run migrations:

   ```bash
   bun run migrate
   ```

3. Run tests:
   ```bash
   bun test
   ```

### Database Structure

The database includes the following tables:

- **markets**: Stores market information (symbols, exchanges, etc.)
- **market_data**: Stores historical market data (OHLCV, bid/ask)
- **migrations**: Tracks executed migrations

### Scripts

- `bun run migrate` - Run database migrations
- `bun test` - Run all tests
- `bun run dev` - Start development server with hot reload
- `bun run lint` - Run ESLint with auto-fix
- `bun run type-check` - Run TypeScript type checking

### Environment Variables

Create a `.env` file in the backend directory:

```
DB_FILE=tradebot.db
NODE_ENV=development
```

### Development

The database uses SQLite by default, which is perfect for development. For production, you can switch to PostgreSQL by updating the database configuration.

### Testing

Tests use an in-memory SQLite database for fast execution and isolation.
