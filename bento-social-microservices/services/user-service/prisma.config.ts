import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://bento:bento_secret@localhost:5432/user_db';

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: databaseUrl,
  },
});
