# Database Migration System

## Commands

- `bun migrate.ts migrate` - Run all pending migrations
- `bun migrate.ts rollback [N]` - Rollback last N migrations (default: 1)
- `bun migrate.ts status` - Show applied/pending migrations

## Add New Migration

1. Create `migrations/XXX_name.ts`
2. Export `{ up, down }` functions with PgClient param
3. Run `bun migrate.ts migrate`

## Files

- `migrate.ts` - Migration runner with transaction support
- `init.sql` - Initial PostgreSQL setup with TimescaleDB
- `migrations/` - Migration files (001_initial_schema.ts, etc.)
