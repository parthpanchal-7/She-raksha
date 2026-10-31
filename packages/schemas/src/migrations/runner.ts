/**
 * @she-raksha/schemas — Migration Runner
 *
 * Reads DATABASE_URL from environment and applies all SQL migrations.
 *
 * Usage (after building):
 *   DATABASE_URL=postgres://user:pass@host:5432/sheraksha \
 *     node dist/migrations/runner.js
 *
 * For Supabase (Phase D3):
 *   Use: supabase db push  (preferred for production)
 *   Or:  psql "$DATABASE_URL" < packages/schemas/src/migrations/001_init_core_schema.sql
 *
 * This runner exports the migration SQL as a string for programmatic use
 * (e.g., in integration tests or CI/CD pipelines).
 */

import { MIGRATION_001 } from './001_migration.js';

export { MIGRATION_001 };

export const ALL_MIGRATIONS: Array<{ filename: string; sql: string }> = [
  { filename: '001_init_core_schema.sql', sql: MIGRATION_001 },
];

/**
 * Prints migration info and the DATABASE_URL (redacted) to stdout.
 * Actual execution requires psql in PATH or Supabase CLI.
 */
function printMigrationInstructions(): void {
  const DATABASE_URL = process.env['DATABASE_URL'];
  const safeUrl = DATABASE_URL
    ? DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@')
    : '(not set)';

  console.log('🔗 She-Raksha Migration Runner — Phase 2');
  console.log(`   Database URL: ${safeUrl}`);
  console.log(`\n📋 ${ALL_MIGRATIONS.length} migration(s) to apply:\n`);

  for (const { filename } of ALL_MIGRATIONS) {
    console.log(`   • ${filename}`);
  }

  if (!DATABASE_URL) {
    console.error(
      '\n❌ DATABASE_URL is not set. Set it and re-run:\n' +
      '   DATABASE_URL=postgres://... node dist/migrations/runner.js\n' +
      '\n💡 To apply manually:\n' +
      '   psql "$DATABASE_URL" < packages/schemas/src/migrations/001_init_core_schema.sql'
    );
    process.exit(1);
  }

  console.log(
    '\n💡 Apply migrations with:\n' +
    `   psql "${safeUrl}" < packages/schemas/src/migrations/001_init_core_schema.sql\n` +
    '\n   Or with Supabase CLI (recommended for Phase D3):\n' +
    '   supabase db push\n'
  );
}

// Run when executed directly
const isMain = process.argv[1]?.endsWith('runner.js') || process.argv[1]?.endsWith('runner.ts');
if (isMain) {
  printMigrationInstructions();
}
