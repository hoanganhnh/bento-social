# How to run

1. Clone this repo
2. Install dependencies: `pnpm install`
3. Start services with docker compose: `docker-compose up -d`
4. Migrate db with Prisma:

  ``` env
  export DATABASE_URL="postgresql://ptit:ptit_secret@localhost:5432/bento-social?connection_limit=50"
  pnpx prisma migrate dev
  pnpx prisma generate
  ```

 Start the server: `pnpm start`
