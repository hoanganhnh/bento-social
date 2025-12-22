import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config'; // Ensure environment variables are loaded

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://ptit:ptit_secret@localhost:5432/bento-social?connection_limit=50';

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    // Command Prisma will run for `prisma db seed`
    seed: 'pnpm exec ts-node ./prisma/seed.ts',
  },
});
