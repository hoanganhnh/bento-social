#!/bin/bash
# Export the database from the postgres-bento container
# --clean: Include commands to drop database objects (tables, views, etc.) before creating them.
# --if-exists: Use IF EXISTS when dropping objects.
docker exec -e PGPASSWORD=ptit_secret postgres-bento pg_dump -U ptit -d bento-social --clean --if-exists > backup.sql
echo "Database dumped to backup.sql"
