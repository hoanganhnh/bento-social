#!/bin/bash
# Import the database to the postgres-bento container
if [ -f backup.sql ]; then
    echo "Restoring database from backup.sql..."
    # Drop existing public schema and recreate it to ensure a clean state before import, or just let psql handle it if dump has drops.
    # Usually pg_dump includes create statements.
    # To be safe, we might want to drop the database and recreate it, but that might need postgres user.
    # Let's try simple psql import first.
    
    cat backup.sql | docker exec -i -e PGPASSWORD=ptit_secret postgres-bento psql -U ptit -d bento-social
    echo "Database restored successfully."
else
    echo "Error: backup.sql not found!"
    exit 1
fi
